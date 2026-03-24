import type { Context, Next } from "hono";
import { AuthService } from "../services/authService";

export class AuthMiddleware {
  private authService = new AuthService();

  public handler = async (c: Context, next: Next) => {
    const cookie = c.req.header("cookie");
    if (!cookie) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const sessionId = this.extractSessionId(cookie);
    if (!sessionId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = await this.authService.validate(sessionId);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", userId);

    await next();
  };

  private extractSessionId(cookie: string): string | null {
    const cookies = cookie.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("sessionId=")) {
        const value = c.split("=")[1];
        return value || null;
      }
    }

    return null;
  }
}