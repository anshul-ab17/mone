package engine

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

type orderRequest struct {
	order    *EngineOrder
	response chan TradeExecutedEvent
}

// MatchingEngine holds one channel+goroutine per market.
// The global mutex only guards map writes; each market's goroutine
// runs its order book sequentially — no lock contention under load.
type MatchingEngine struct {
	mu      sync.Mutex
	markets map[string]chan orderRequest
}

func NewMatchingEngine() *MatchingEngine {
	return &MatchingEngine{markets: make(map[string]chan orderRequest)}
}

// getOrCreate returns the channel for a market, creating it (and its
// dedicated goroutine) on first access.
func (me *MatchingEngine) getOrCreate(marketID string) chan orderRequest {
	me.mu.Lock()
	defer me.mu.Unlock()
	if ch, ok := me.markets[marketID]; ok {
		return ch
	}
	ch := make(chan orderRequest, 256)
	me.markets[marketID] = ch
	go me.runMarket(ch)
	return ch
}

// runMarket is the per-market event loop. It owns its OrderBook exclusively,
// so no synchronisation is needed inside processOrder.
func (me *MatchingEngine) runMarket(ch chan orderRequest) {
	book := NewOrderBook()
	for req := range ch {
		result := processOrder(req.order, book)
		req.response <- result
	}
}

// Process submits an order to its market's goroutine and waits for the result.
func (me *MatchingEngine) Process(order *EngineOrder) TradeExecutedEvent {
	ch := me.getOrCreate(order.MarketID)
	resp := make(chan TradeExecutedEvent, 1)
	ch <- orderRequest{order: order, response: resp}
	return <-resp
}

// processOrder runs entirely inside the market goroutine — no locks needed.
func processOrder(order *EngineOrder, book *OrderBook) TradeExecutedEvent {
	var trades []Trade

	if order.Side == SideBuy {
		matchBuy(order, book, &trades)
	} else {
		matchSell(order, book, &trades)
	}

	remaining := order.Quantity - order.Filled
	if remaining > 0 {
		o := *order
		book.AddOrder(&o)
	}

	return TradeExecutedEvent{
		OrderID:      order.ID,
		FilledQty:    order.Filled,
		RemainingQty: remaining,
		Trades:       trades,
	}
}

func matchBuy(order *EngineOrder, book *OrderBook, trades *[]Trade) {
	for {
		best := book.BestAsk()
		if best == nil || order.Price < best.Price {
			break
		}
		if len(best.Orders) == 0 {
			book.RemoveEmptyAskLevel(best.Price)
			continue
		}

		match := best.Orders[0]
		remaining := order.Quantity - order.Filled
		matchRemaining := match.Quantity - match.Filled
		qty := min64(remaining, matchRemaining)

		*trades = append(*trades, Trade{
			ID:          newID(),
			MarketID:    order.MarketID,
			BuyOrderID:  order.ID,
			SellOrderID: match.ID,
			Price:       best.Price,
			Quantity:    qty,
			Timestamp:   time.Now().UnixMilli(),
		})

		order.Filled += qty
		match.Filled += qty

		if match.Filled >= match.Quantity {
			best.Orders = best.Orders[1:]
		}
		book.RemoveEmptyAskLevel(best.Price)

		if order.Filled >= order.Quantity {
			break
		}
	}
}

func matchSell(order *EngineOrder, book *OrderBook, trades *[]Trade) {
	for {
		best := book.BestBid()
		if best == nil || order.Price > best.Price {
			break
		}
		if len(best.Orders) == 0 {
			book.RemoveEmptyBidLevel(best.Price)
			continue
		}

		match := best.Orders[0]
		remaining := order.Quantity - order.Filled
		matchRemaining := match.Quantity - match.Filled
		qty := min64(remaining, matchRemaining)

		*trades = append(*trades, Trade{
			ID:          newID(),
			MarketID:    order.MarketID,
			BuyOrderID:  match.ID,
			SellOrderID: order.ID,
			Price:       best.Price,
			Quantity:    qty,
			Timestamp:   time.Now().UnixMilli(),
		})

		order.Filled += qty
		match.Filled += qty

		if match.Filled >= match.Quantity {
			best.Orders = best.Orders[1:]
		}
		book.RemoveEmptyBidLevel(best.Price)

		if order.Filled >= order.Quantity {
			break
		}
	}
}

func min64(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func newID() string {
	id, err := uuid.NewRandom()
	if err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return id.String()
}
