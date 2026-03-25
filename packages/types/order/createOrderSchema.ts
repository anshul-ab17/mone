import { z } from "zod";

export class createOrderSchema{
    public static create = z.object({
        asset: z.string(),
        side:z.enum(["BUY","SELL"]),
        type:z.enum(["LIMIT", "MARKET"]),
        price:z.number().optional(),
        quantity:z.number().positive()
    }).refine((data) =>{
    if(data.type ==="LIMIT" && !data.price) return false;
    if(data.type ==="MARKET" && data.price) return false;

    return true;
  },{
    message:"Invalid price for order type.",
    path:["price"]
  });
}

export type createOrderSchemaInput =  z.infer<typeof createOrderSchema.create>;