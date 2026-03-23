import { Hono } from "Hono";
import * as controller from "../controllers/user.controller";

export const userRouters = new Hono();
userRouters.get(":/id", controller.getUser);