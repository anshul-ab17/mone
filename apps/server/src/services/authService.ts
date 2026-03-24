import jwt from "jsonwebtoken";
import RedisClient from "@repo/pubsub";
import { env } from "@repo/config";

export class AuthService {
  public generateAccessToken(userId: string) {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: "15m",
    });
  }

  public generateRefreshToken(userId: string) {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: "7d",
    });
  }

  public async createSession(userId: string) {
    const redis = await RedisClient.getInstance();
    const sessionId = crypto.randomUUID();

    await redis.set(`session:${sessionId}`, userId, {
      EX: 86400 * 7,
    });

    return sessionId;
  }

  public async deleteSession(sessionId: string) {
    const redis = await RedisClient.getInstance();
    await redis.del(`session:${sessionId}`);
  }

  public async validate(sessionId: string) {
    const redis = await RedisClient.getInstance();
    return redis.get(`session:${sessionId}`);
  }
}