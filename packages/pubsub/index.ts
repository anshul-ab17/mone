import { createClient, type RedisClientType } from "redis";
import { env } from "@repo/config";

class RedisClient {
  private static instance:RedisClientType;
  private constructor() {}

  public static async getInstance() {
    if (!this.instance) {
      this.instance = createClient({ url: env.REDIS_URL });

      this.instance.on("error", (err) =>
        console.error("Redis Error:", err)
      );

      await this.instance.connect();
    }
    return this.instance;
  }

  // returns a fresh, dedicated client for Redis Pub/Sub subscriptions.
  // subscribers must use a separate connection 
  public static async getSubscriberClient(): Promise<RedisClientType> {
    const main = await this.getInstance();
    const subscriber = main.duplicate() as RedisClientType;
    subscriber.on("error", (err) => console.error("Redis Subscriber Error:", err));
    await subscriber.connect();
    return subscriber;
  }
}
export default RedisClient;