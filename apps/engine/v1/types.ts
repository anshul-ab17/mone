export type Side ="BUY" | "SELL";

export type EngineOrder = {
    id: string;
    userId:String;
    marketId: string;

    price:number;
    quantity:number;
    filled:number;
    
    side: Side;
    
    timeStamp:number;
}

export type Trade ={
    id:string;
    marketId:string;

    price:number;
    quantity:number;

    buyOrderId:string;
    sellOrderId:string;

    timeStamp:number
}