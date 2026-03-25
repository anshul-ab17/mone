import { Hono } from "Hono";
import { userRouters } from "./userRoutes"; 
import { walletRouters } from "./walletRoutes";
import { orderRoutes } from "./orderRoutes";

export const routes = new Hono();
routes.route('/user', userRouters);
routes.route('/wallet', walletRouters);
routes.route('/orders', orderRoutes);
