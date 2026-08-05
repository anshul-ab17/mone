import {app} from "./app";
import { env } from "@repo/config";
import { websocket } from "./ws/wsHandler";
import { startDepositMonitor } from "./services/solana/depositMonitor";
import { startWithdrawalQueue } from "./services/solana/withdrawalQueue";
import { startSettlementWorker } from "./eventbroker/worker";
import { getNats } from "@repo/eventbroker";

Bun.serve({
    port:Number(env.PORT) || 3001,
    fetch:app.fetch,
    websocket,
})

startDepositMonitor();
startWithdrawalQueue();

if (env.USE_NATS === "true") {
  // Ensure NATS streams exist before starting the consumer.
  await getNats().catch((err) => console.error("NATS connect failed", err));
  startSettlementWorker().catch(console.error);
  console.log("NATS settlement worker started");
}

console.log(`server is running on :${env.PORT}`);
