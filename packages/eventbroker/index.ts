import { Kafka } from "kafkajs";
import { env } from "@repo/config";

export const Topics = {
  ORDER_PLACED: "order.placed",
  TRADE_EXECUTED: "trade.executed",
} as const;

export type TopicName = (typeof Topics)[keyof typeof Topics];


export const kafka = new Kafka({
  clientId: "mone",
  brokers: [env.KAFKA_BROKER],
  retry: { retries: 3 },
});
