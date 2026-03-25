import type { Context, Next } from "hono";
import { AuthService } from "../services/authService";

const authService = new AuthService();

export const authMiddleware = async (c: Context, next: Next) => {
  const cookie = c.req.header("cookie");
  if (!cookie) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = extractSessionId(cookie);
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = await authService.validate(sessionId);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
};

function extractSessionId(cookie: string): string | null {
  const cookies = cookie.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith("sessionId=")) {
      return c.split("=")[1] || null;
    }
  }
  return null;
}