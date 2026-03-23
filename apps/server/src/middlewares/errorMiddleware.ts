import type { Context, Next } from "hono";
import { AppError } from "../utils/appError";

export const errorMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    if (err instanceof AppError) {
      return c.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        err.status
      );
    }

    console.error(err);

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        },
      },
      500
    );
  }
};