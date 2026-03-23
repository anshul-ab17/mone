import jwt from "jsonwebtoken";
import RedisClient from "@repo/pubsub";
import { env } from "@repo/config";

export class AuthService {
  public generateToken(userId: string) {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "15m" });
  }

  public async createSession(userId: string) {
    const redis = await RedisClient.getInstance();

    const sessionId = crypto.randomUUID();

    await redis.set(`session:${sessionId}`, userId, { EX: 86400 });

    return sessionId;
  }

  public async validate(sessionId: string) {
    const redis = await RedisClient.getInstance();
    return redis.get(`session:${sessionId}`);
  }
}