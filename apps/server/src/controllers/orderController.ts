import type { Context } from "hono";
import { OrderService } from "../services/orderService";
import type { CreateOrderInput } from "@repo/types";

export class OrderController {
  private service = new OrderService();

  public createOrder = async (c: Context) => {
    const userId = c.get("userId") as string;
    const body = c.get("validatedBody") as CreateOrderInput;

    const order = await this.service.createOrder(userId, body);

    return c.json(order, 201);
  };

  public cancelOrder = async (c: Context) => {
    const userId = c.get("userId") as string;
    const orderId = c.req.param("id");

    if (!orderId) {
    return c.json({ error: "Order ID is required" }, 400);
    }

    const result = await this.service.cancelOrder(userId, orderId);

    return c.json(result);
  };

  public getOrders = async (c: Context) => {
    const userId = c.get("userId") as string;

    const orders = await this.service.getUserOrders(userId);

    return c.json(orders);
  };
}