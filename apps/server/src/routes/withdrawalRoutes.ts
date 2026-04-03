import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware";
import { WithdrawalController } from "../controllers/withdrawalController";

const controller = new WithdrawalController();
export const withdrawalRoutes = new Hono();

withdrawalRoutes.use("*", authMiddleware);
withdrawalRoutes.post("/", (c) => controller.requestWithdrawal(c));
withdrawalRoutes.get("/history", (c) => controller.getHistory(c));
