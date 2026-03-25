import type { Context, Next } from "hono";
import RedisClient from "@repo/pubsub";

const LIMIT = 5;
const WINDOW = 60;

export const rateMiddleware = async (c: Context, next: Next) => {
  const ip = c.req.header("x-forwarded-for") || "global";
  const redis = await RedisClient.getInstance();

  const key = `rate:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW);
  }

  if (count > LIMIT) {
    return c.json({ error: "Too many requests" }, 429);
  }

  await next();
};