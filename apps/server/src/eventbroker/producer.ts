import { kafka, Topics } from "@repo/eventbroker";
import type { EngineOrder } from "../engine/v1/types";

const producer = kafka.producer();
let connected = false;

async function ensureConnected() {
  if (!connected) {
    await producer.connect();
    connected = true;
  }
}

export async function publishOrderPlaced(order: EngineOrder) {
  await ensureConnected();
  await producer.send({
    topic: Topics.ORDER_PLACED,
    messages: [{ key: order.marketId, value: JSON.stringify({ order }) }],
  });
}
