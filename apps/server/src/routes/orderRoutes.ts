import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateOrder } from "../middlewares/validateOrder";
import { OrderController } from "../controllers/orderController";

export const orderRoutes = new Hono();
const controller = new OrderController();

orderRoutes.post('/', authMiddleware, validateOrder, controller.createOrder);
orderRoutes.delete('/:id', authMiddleware, controller.cancelOrder);
orderRoutes.get('/', authMiddleware, controller.getOrders);