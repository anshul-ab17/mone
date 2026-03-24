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
}
export default RedisClient;