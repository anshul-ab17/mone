import { Hono } from "Hono";
import { userRouters } from "../modules/user.routes";

export const routes = new Hono();
routes.route('/users', userRouters);

