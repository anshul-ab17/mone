import type { Context } from "hono";
import jwt from "jsonwebtoken";
import { AuthSchemas } from "@repo/types";
import { AppError } from "../utils/appError";
import { UserService } from "../services/userService";
import { AuthService } from "../services/authService";

export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  public signup = async (c: Context) => {
    const body = await c.req.json();

    const parsed = AuthSchemas.signup.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400);
    }

    const user = await this.userService.signup(
      parsed.data.email,
      parsed.data.password
    );

    return c.json({ success: true, data: user });
  };

  public signin = async (c: Context) => {
    const body = await c.req.json();

    const parsed = AuthSchemas.signin.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400);
    }

    const user = await this.userService.signin(
      parsed.data.email,
      parsed.data.password
    );

    const access = this.authService.generateAccessToken(user.id);
    const refresh = this.authService.generateRefreshToken(user.id);
    const sessionId = await this.authService.createSession(user.id);

    c.header(
      "Set-Cookie",
      `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Strict`
    );

    return c.json({
      success: true,
      data: { access, refresh },
    });
  };

  public signout = async (c: Context) => {
    const cookie = c.req.header("cookie");
    if (!cookie) throw new AppError("UNAUTHORIZED", 401);
    
    const sessionId = this.extractSessionId(cookie);
    if (!sessionId) throw new AppError("UNAUTHORIZED", 401);

    await this.authService.deleteSession(sessionId);
    c.header("Set-Cookie", "sessionId=; Max-Age=0; Path=/");
    return c.json({ success: true });
  };

  public refresh = async (c: Context) => {
    const body = await c.req.json();
    const parsed = AuthSchemas.refresh.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400);
    }

    try {
      const payload = this.verify(parsed.data.refresh) as { userId: string };

      const access = this.authService.generateAccessToken(payload.userId);

      return c.json({
        success: true,
        data: { access },
      });
    } catch {
      throw new AppError("INVALID_TOKEN", 401);
    }
  };

  private verify(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  }

  private extractSessionId(cookie: string): string | null {
    const cookies = cookie.split(";").map((c) => c.trim());

    for (const c of cookies) {
      if (c.startsWith("sessionId=")) {
        return c.split("=")[1] || null;
      }
    }

    return null;
  }
}