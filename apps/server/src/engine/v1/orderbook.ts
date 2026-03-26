import  type { EngineOrder, Side } from "./types";

export class OrderBook{
    bids: Map<number, EngineOrder[]> = new Map(); //highest buyer first. 
    asks: Map<number, EngineOrder[]> = new Map(); // lowest seller first.

    add(order:EngineOrder){
        const book =order.side ==="BUY"? this.bids: this.asks;

        if(!book.has(order.price)){
            book.set(order.price,[]);
        }
        book.get(order.price)!.push(order);
    }

    getBestBid(): number | null {
        if(this.bids.size===0) return null;
        return Math.max(...this.bids.keys());
    }

    getBestAsk():number | null{
        if(this.asks.size===0) return null;
        return Math.min(...this.asks.keys());
    }

    removeEmpty(price:number, side:Side){
        const book =side ==="BUY"? this.bids:this.asks;

        if(book.get(price)?.length===0){
            book.delete(price);
        }
    }
}