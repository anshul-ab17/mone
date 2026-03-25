import type { Context, Next } from "hono";
import type { z } from "zod";
import { AppError } from "../lib/appError";

export const validate = (schema: z.ZodType) => {
  return async (c: Context, next: Next) => {
    const body = await c.req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400);
    }

    c.set("validatedBody", parsed.data);
    await next();
  };
};