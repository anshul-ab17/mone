import { Hono } from "hono";
import { userRouters } from "./userRoutes";
import { walletRouters } from "./walletRoutes";
import { orderRoutes } from "./orderRoutes";
import { depositRoutes } from "./depositRoutes";
import { withdrawalRoutes } from "./withdrawalRoutes";
import { marketRoutes } from "./marketRoutes";

export const routes = new Hono();
routes.route('/user', userRouters);
routes.route('/wallet', walletRouters);
routes.route('/orders', orderRoutes);
routes.route('/deposit', depositRoutes);
routes.route('/withdrawal', withdrawalRoutes);
routes.route('/markets', marketRoutes);
