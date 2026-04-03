import RedisClient from "@repo/pubsub";
import { engine } from "../engine/v1";
import { MarketRepo } from "../repo/marketRepo";
import type { Trade } from "../engine/v1/types";

const marketRepo = new MarketRepo();

export async function publishOrderbook(marketId: string) {
  const snapshot = engine.getSnapshot(marketId);
  const redis = await RedisClient.getInstance();
  await redis.publish(`orderbook:${marketId}`, JSON.stringify(snapshot));
}

export async function publishTrades(marketId: string, trades: Trade[]) {
  const redis = await RedisClient.getInstance();
  for (const trade of trades) {
    await redis.publish(`trades:${marketId}`, JSON.stringify(trade));
  }
}

export async function publishTicker(marketId: string) {
  const ticker = await marketRepo.getTicker(marketId);
  const redis = await RedisClient.getInstance();
  await redis.publish(`ticker:${marketId}`, JSON.stringify(ticker));
}
