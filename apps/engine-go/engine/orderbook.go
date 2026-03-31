package engine

import "sort"

// PriceLevel holds all orders at a given price
type PriceLevel struct {
	Price  float64
	Orders []*EngineOrder
}

// OrderBook holds bids and asks for one market
type OrderBook struct {
	// bids: highest price first
	Bids []*PriceLevel
	// asks: lowest price first
	Asks []*PriceLevel
}

func NewOrderBook() *OrderBook {
	return &OrderBook{}
}

func (ob *OrderBook) BestBid() *PriceLevel {
	if len(ob.Bids) == 0 {
		return nil
	}
	return ob.Bids[0]
}

func (ob *OrderBook) BestAsk() *PriceLevel {
	if len(ob.Asks) == 0 {
		return nil
	}
	return ob.Asks[0]
}

func (ob *OrderBook) AddOrder(order *EngineOrder) {
	if order.Side == SideBuy {
		ob.addBid(order)
	} else {
		ob.addAsk(order)
	}
}

func (ob *OrderBook) addBid(order *EngineOrder) {
	for _, level := range ob.Bids {
		if level.Price == order.Price {
			level.Orders = append(level.Orders, order)
			return
		}
	}
	ob.Bids = append(ob.Bids, &PriceLevel{Price: order.Price, Orders: []*EngineOrder{order}})
	// Sort descending
	sort.Slice(ob.Bids, func(i, j int) bool { return ob.Bids[i].Price > ob.Bids[j].Price })
}

func (ob *OrderBook) addAsk(order *EngineOrder) {
	for _, level := range ob.Asks {
		if level.Price == order.Price {
			level.Orders = append(level.Orders, order)
			return
		}
	}
	ob.Asks = append(ob.Asks, &PriceLevel{Price: order.Price, Orders: []*EngineOrder{order}})
	// Sort ascending
	sort.Slice(ob.Asks, func(i, j int) bool { return ob.Asks[i].Price < ob.Asks[j].Price })
}

func (ob *OrderBook) RemoveEmptyBidLevel(price float64) {
	ob.Bids = removeLevelIfEmpty(ob.Bids, price)
}

func (ob *OrderBook) RemoveEmptyAskLevel(price float64) {
	ob.Asks = removeLevelIfEmpty(ob.Asks, price)
}

func removeLevelIfEmpty(levels []*PriceLevel, price float64) []*PriceLevel {
	for i, l := range levels {
		if l.Price == price && len(l.Orders) == 0 {
			return append(levels[:i], levels[i+1:]...)
		}
	}
	return levels
}
