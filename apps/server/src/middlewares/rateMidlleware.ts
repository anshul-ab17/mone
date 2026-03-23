import type { Context, Next } from "hono";
import RedisClient from "@repo/pubsub";

export class RateLimiter {
  private LIMIT = 5;
  private WINDOW = 60; // seconds

  public handler = async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") || "global";
    const redis = await RedisClient.getInstance();
    const key = `rate:${ip}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, this.WINDOW);
    }

    if (count > this.LIMIT) {
      return c.json(
        { error: "Too many requests" },
        429
      );
    }

    await next();
  };
}