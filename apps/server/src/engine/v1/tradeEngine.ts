import { randomUUID } from "crypto";
import type { EngineOrder, Trade } from "./types";


export class TradeEngine{
    execute(
        buy:EngineOrder, sell:EngineOrder, 
        quantity:number, price:number): Trade {
        const trade:Trade ={
            id:randomUUID(),
            marketId:buy.marketId,
            price, quantity,
            buyOrderId:buy.id,
            sellOrderId:sell.id,
            timeStamp:Date.now(),
        }
        console.log("TRADE_EXECUTED", trade);
        return trade;
    }
}