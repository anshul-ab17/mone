import type { Context } from "hono";
import jwt from "jsonwebtoken";
import type { SignupInput, RefreshInput } from "@repo/types";
import { AppError } from "../lib/appError";
import { UserService } from "../services/userService";
import { AuthService } from "../services/authService";

export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  public signup = async (c: Context) => {
    const { email, password } = c.get("validatedBody") as SignupInput;
    const user = await this.userService.signup(email, password);
    return c.json({ success: true, data: user });
  };

  public signin = async (c: Context) => {
    const { email, password } = c.get("validatedBody") as SignupInput;
    const user = await this.userService.signin(email, password);

    const access = this.authService.generateAccessToken(user.id);
    const refresh = this.authService.generateRefreshToken(user.id);
    const sessionId = await this.authService.createSession(user.id);

    c.header(
      "Set-Cookie",
      `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Secure`
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
    const { refresh } = c.get("validatedBody") as RefreshInput;
    try {
      const payload = this.verify(refresh) as { userId: string };

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