package engine

type Side string

const (
	SideBuy  Side = "BUY"
	SideSell Side = "SELL"
)

// EngineOrder mirrors the TS EngineOrder type published on order.placed
type EngineOrder struct {
	ID       string  `json:"id"`
	UserID   string  `json:"userId"`
	MarketID string  `json:"marketId"`
	Side     Side    `json:"side"`
	Price    float64 `json:"price"`
	Quantity float64 `json:"quantity"`
	Filled   float64 `json:"filled"`
	Time     int64   `json:"timestamp"`
}

// Trade is the result of matching two orders
type Trade struct {
	ID          string  `json:"id"`
	MarketID    string  `json:"marketId"`
	BuyOrderID  string  `json:"buyOrderId"`
	SellOrderID string  `json:"sellOrderId"`
	Price       float64 `json:"price"`
	Quantity    float64 `json:"quantity"`
	Timestamp   int64   `json:"timestamp"`
}

// OrderPlacedEvent is what the TS server publishes to order.placed
type OrderPlacedEvent struct {
	Order EngineOrder `json:"order"`
}

// TradeExecutedEvent is what this engine publishes to trade.executed
type TradeExecutedEvent struct {
	OrderID     string  `json:"orderId"`
	FilledQty   float64 `json:"filledQty"`
	RemainingQty float64 `json:"remainingQty"`
	Trades      []Trade `json:"trades"`
}
