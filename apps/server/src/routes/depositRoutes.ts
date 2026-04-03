import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware";
import { DepositController } from "../controllers/depositController";

const controller = new DepositController();
export const depositRoutes = new Hono();

depositRoutes.use("*", authMiddleware);
depositRoutes.get("/address", (c) => controller.getAddress(c));
depositRoutes.get("/history", (c) => controller.getHistory(c));
