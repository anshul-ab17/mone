import { Hono } from "Hono";
import { userRouters } from "./userRoutes"; 

export const routes = new Hono();
routes.route('/users', userRouters);
