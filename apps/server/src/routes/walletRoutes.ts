import { Hono } from "hono";
import { WalletController } from "../controllers/walletController";
import { WalletSchema } from "@repo/types";
import { validate } from "../middlewares/validateMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

export const walletRouters = new Hono();
const controller = new WalletController();

walletRouters.use("*", authMiddleware);

walletRouters.get('/', (c) => controller.getWallets(c));
walletRouters.post(
  '/deposit',
  validate(WalletSchema.deposit),
  (c) => controller.deposit(c)
);