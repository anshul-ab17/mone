import { Streams, getNats } from "@repo/eventbroker";
import type { EngineOrder } from "../engine/v1/types";

let jsReady: Awaited<ReturnType<typeof getNats>>["js"] | null = null;

async function ensureJS() {
  if (!jsReady) {
    const { js } = await getNats();
    jsReady = js;
  }
  return jsReady;
}

export async function publishOrderPlaced(order: EngineOrder) {
  const js = await ensureJS();
  await js.publish(Streams.ORDER_PLACED, JSON.stringify({ order }));
}
