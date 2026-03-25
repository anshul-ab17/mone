import { OrderSchema } from "@repo/types";
import { z } from "zod";
import type { Context, Next } from "hono";

export const validateOrder = async (c: Context, next: Next) => {
  const body = await c.req.json();
  const parsed = OrderSchema.create.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: z.treeifyError(parsed.error),
      },
      400
    );
  }
  c.set("validatedBody", parsed.data);

  await next();
};