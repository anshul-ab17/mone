import { z } from "zod";

export class OrderSchemas {
  public static create = z.object({
    marketId: z.string(),
    type: z.enum(["BUY", "SELL"]),
    price: z.number().positive(),
    quantity: z.number().positive(),
  });
}

export type CreateOrderInput = z.infer<typeof OrderSchemas.create>;