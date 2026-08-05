import { connect, type NatsConnection, type JetStreamClient, type JetStreamManager, type StreamConfig } from "nats";
import { env } from "@repo/config";

export const Streams = {
  ORDER_PLACED: "order.placed",
  TRADE_EXECUTED: "trade.executed",
} as const;

export type StreamName = (typeof Streams)[keyof typeof Streams];

/**
 * NATS connection singleton (JetStream enabled).
 * Falls back to the raw NATS_URL if provided, else derives from NATS_HOST.
 */
let nc: NatsConnection | null = null;
let js: JetStreamClient | null = null;
let jsm: JetStreamManager | null = null;

export function natsUrl(): string {
  if (env.NATS_URL) return env.NATS_URL;
  const host = env.NATS_HOST ?? "localhost";
  const port = env.NATS_PORT ?? 4222;
  return `nats://${host}:${port}`;
}

export async function getNats(): Promise<{ nc: NatsConnection; js: JetStreamClient; jsm: JetStreamManager }> {
  if (nc && js && jsm) return { nc, js, jsm };
  nc = await connect({ servers: natsUrl() });
  js = nc.jetstream();
  jsm = await nc.jetstreamManager();

  // Ensure the two streams exist (idempotent).
  const wanted: StreamConfig[] = [
    { name: Streams.ORDER_PLACED, subjects: [Streams.ORDER_PLACED] },
    { name: Streams.TRADE_EXECUTED, subjects: [Streams.TRADE_EXECUTED] },
  ];
  for (const cfg of wanted) {
    try {
      await jsm.streams.add(cfg);
    } catch (err: any) {
      // 10058 = stream already exists — safe to ignore.
      if (err?.api_error?.err_code !== 10058) throw err;
    }
  }
  return { nc, js, jsm };
}
