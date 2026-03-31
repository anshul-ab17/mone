import { createBunWebSocket } from "hono/bun";
import RedisClient from "@repo/pubsub";
import { wsRegistry } from "./registry";

export const { upgradeWebSocket, websocket } = createBunWebSocket();

// Start a dedicated Redis subscriber that fans out messages to connected WS clients.
async function startSubscriber() {
  try {
    const subscriber = await RedisClient.getSubscriberClient();

    // Single pattern subscribe covers all markets for both channel types.
    await subscriber.pSubscribe("orderbook:*", (message, channel) => {
      wsRegistry.broadcast(channel, JSON.stringify({ channel, data: JSON.parse(message) }));
    });

    await subscriber.pSubscribe("trades:*", (message, channel) => {
      wsRegistry.broadcast(channel, JSON.stringify({ channel, data: JSON.parse(message) }));
    });

    console.log("Redis pub/sub subscriber ready");
  } catch (err) {
    console.error("Failed to start Redis subscriber:", err);
  }
}

startSubscriber();

// Client message format: { action: "subscribe" | "unsubscribe", channel: "orderbook:<marketId>" | "trades:<marketId>" }
// Server message format: { channel: string, data: object } | { status: string, channel: string }
export const wsRoute = upgradeWebSocket(() => ({
  onOpen(_event, ws) {
    console.log("WS client connected");
    ws.send(JSON.stringify({ status: "connected" }));
  },

  onMessage(event, ws) {
    try {
      const { action, channel } = JSON.parse(event.data as string);

      if (typeof channel !== "string" || !channel) {
        ws.send(JSON.stringify({ error: "channel required" }));
        return;
      }

      const validPrefix = channel.startsWith("orderbook:") || channel.startsWith("trades:");
      if (!validPrefix) {
        ws.send(JSON.stringify({ error: "channel must start with orderbook: or trades:" }));
        return;
      }

      const raw = ws.raw;
      if (action === "subscribe") {
        wsRegistry.subscribe(channel, raw);
        ws.send(JSON.stringify({ status: "subscribed", channel }));
      } else if (action === "unsubscribe") {
        wsRegistry.unsubscribe(channel, raw);
        ws.send(JSON.stringify({ status: "unsubscribed", channel }));
      } else {
        ws.send(JSON.stringify({ error: "unknown action" }));
      }
    } catch {
      ws.send(JSON.stringify({ error: "invalid JSON" }));
    }
  },

  onClose(_event, ws) {
    wsRegistry.unsubscribeAll(ws.raw);
    console.log("WS client disconnected");
  },
}));
