import { Context } from "hono";

export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  public signup = async (c: Context) => {
    const { email, password } = await c.req.json();

    const user = await this.userService.signup(email, password);

    return c.json(user);
  };

  public signin = async (c: Context) => {
    const { email, password } = await c.req.json();

    const user = await this.userService.signin(email, password);

    const token = this.authService.generateToken(user.id);
    const sessionId = await this.authService.createSession(user.id);

    c.header("Set-Cookie", `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Strict`);

    return c.json({ token });
  };
}