import { z } from "zod";

export class AuthSchemas {
  public static signup = z.object({

    email: z.email(),
    password: z.string().min(6),
  });

  public static signin = AuthSchemas.signup;

  public static refresh = z.object({
    refresh: z.string(),
  });
}
 
export type SignupInput = z.infer<typeof AuthSchemas.signup>;
export type SigninInput = z.infer<typeof AuthSchemas.signin>;
export type RefreshInput = z.infer<typeof AuthSchemas.refresh>;