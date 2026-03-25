import { Hono } from "Hono";
import { UserRepo } from "../repo/userRepo";
import { AuthService } from "../services/authService";
import { UserController } from "../controllers/userController"
import { UserService } from "../services/userService"
import { validate } from "../middlewares/validateMiddleware";
import { AuthSchemas } from "@repo/types";

const repo = new UserRepo();
const service = new UserService(repo);
const auth = new AuthService();
const controller = new UserController(service, auth);

export const userRouters = new Hono();

userRouters.post('/signup', validate(AuthSchemas.signup), controller.signup);
userRouters.post('/signin', validate(AuthSchemas.signin), controller.signin);
userRouters.post("/signout", controller.signout);
userRouters.post("/refresh", validate(AuthSchemas.refresh), controller.refresh);
 