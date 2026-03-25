import { OrderBook } from "./orderbook";
import { TradeEngine } from "./tradeEngine";
import { EngineOrder } from "./types";



export class MatchingEngine{
    private books: Map<string, OrderBook> =  new Map();
    private tradeEngine = new TradeEngine();

    private getBook(marketId:string): OrderBook{
        if(!this.books.has(marketId)){
            this.books.set(marketId, new OrderBook());
        }

        return this.books.get(marketId)!;
    }

    private matchBuy(order: EngineOrder, book: OrderBook) {
        while (true) {
            const bestAsk = book.getBestAsk();
            if (bestAsk === null) break;

            if (order.price < bestAsk) break;

            const asks = book.asks.get(bestAsk)!;
            const match = asks[0];

            const remaining = order.quantity - order.filled;
            const matchRemaining = match.quantity - match.filled;

            const tradeQty = Math.min(remaining, matchRemaining);
            this.tradeEngine.execute(order, match, tradeQty, bestAsk);

            order.filled += tradeQty;
            match.filled += tradeQty;

            if (match.filled === match.quantity) {
            asks.shift();
            }

            book.removeEmpty(bestAsk, "SELL");

            if (order.filled === order.quantity) break;
        }
        }

    private matchSell(order: EngineOrder, book: OrderBook) {
        while (true) {
            const bestBid = book.getBestBid();
            if (bestBid === null) break;

            if (order.price > bestBid) break;

            const bids = book.bids.get(bestBid)!;
            const match = bids[0];

            const remaining = order.quantity - order.filled;
            const matchRemaining = match.quantity - match.filled;
            const tradeQty = Math.min(remaining, matchRemaining);

            this.tradeEngine.execute(match, order, tradeQty, bestBid);

            order.filled += tradeQty;
            match.filled += tradeQty;

            if (match.filled === match.quantity) {
            bids.shift();
            }

            book.removeEmpty(bestBid, "BUY");

            if (order.filled === order.quantity) break;
        }
    }

    process(order:EngineOrder) {
        const book = this.getBook(order.marketId);

        if(order.side==="BUY"){
            this.matchBuy(order, book);
        } else{
            this.matchSell(order, book);
        }

        if(order.quantity> order.filled){
            book.add(order);
        }
    }
}