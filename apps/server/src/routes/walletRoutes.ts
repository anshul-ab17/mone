import { Hono } from "hono";
import { WalletController } from "../controllers/walletController";
import { WalletSchema } from "@repo/types";
import { validate } from "../middlewares/validateMiddleware";


export const walletRouters = new Hono();
const controller = new WalletController();

walletRouters.get('/', (c) => controller.getWallets(c));
walletRouters.post(
  '/deposit',
  validate(WalletSchema.deposit),
  (c) => controller.deposit(c)
);