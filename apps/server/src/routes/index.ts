import { Hono } from "Hono";
import { userRouters } from "./user.routes";

export const routes = new Hono();
routes.route('/users', userRouters);

