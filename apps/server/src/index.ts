import {app} from "./app";
import { env } from "@repo/config";
import { websocket } from "./ws/wsHandler";
import { startDepositMonitor } from "./services/solana/depositMonitor";
import { startWithdrawalQueue } from "./services/solana/withdrawalQueue";
import { startSettlementWorker } from "./eventbroker/worker";

Bun.serve({
    port:Number(env.PORT) || 3001,
    fetch:app.fetch,
    websocket,
})

startDepositMonitor();
startWithdrawalQueue();

if (env.USE_KAFKA === "true") {
  startSettlementWorker().catch(console.error);
  console.log("Kafka settlement worker started");
}

console.log(`server is running on :${env.PORT}`);

