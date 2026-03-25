import type { Context } from "hono";
import { OrderService } from "../services/orderService";

export class OrderController {
  private service = new OrderService();

  public createOrder = async (c: Context) => {
    const userId = c.get("userId");
    const body = c.get("validatedBody");

    const order = await this.service.createOrder(userId, body);

    return c.json(order);
  };

  public cancelOrder = async (c: Context) => {
    const userId = c.get("userId");
    const orderId = c.req.param("id");

    const result = await this.service.cancelOrder(userId, orderId);

    return c.json(result);
  };

  public getOrders = async (c: Context) => {
    const userId = c.get("userId");

    const orders = await this.service.getUserOrders(userId);

    return c.json(orders);
  };
}