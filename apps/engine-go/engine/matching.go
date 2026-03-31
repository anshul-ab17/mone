package engine

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// MatchingEngine holds one order book per market
type MatchingEngine struct {
	mu    sync.Mutex
	books map[string]*OrderBook
}

func NewMatchingEngine() *MatchingEngine {
	return &MatchingEngine{books: make(map[string]*OrderBook)}
}

func (me *MatchingEngine) getBook(marketID string) *OrderBook {
	if _, ok := me.books[marketID]; !ok {
		me.books[marketID] = NewOrderBook()
	}
	return me.books[marketID]
}

// Process matches an incoming order and returns trades + fill quantities.
func (me *MatchingEngine) Process(order *EngineOrder) TradeExecutedEvent {
	me.mu.Lock()
	defer me.mu.Unlock()

	book := me.getBook(order.MarketID)
	var trades []Trade

	if order.Side == SideBuy {
		me.matchBuy(order, book, &trades)
	} else {
		me.matchSell(order, book, &trades)
	}

	remaining := order.Quantity - order.Filled
	if remaining > 0 {
		o := *order // copy to avoid mutation
		book.AddOrder(&o)
	}

	return TradeExecutedEvent{
		OrderID:      order.ID,
		FilledQty:    order.Filled,
		RemainingQty: remaining,
		Trades:       trades,
	}
}

func (me *MatchingEngine) matchBuy(order *EngineOrder, book *OrderBook, trades *[]Trade) {
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

func (me *MatchingEngine) matchSell(order *EngineOrder, book *OrderBook, trades *[]Trade) {
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
