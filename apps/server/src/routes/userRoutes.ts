import { Hono } from "Hono";
import { UserRepo } from "../repo/userRepo";
import { AuthService } from "../services/authService";
import { UserController } from "../controllers/userController"
import { UserService } from "../services/userService"

const repo = new UserRepo();
const service = new UserService(repo);
const auth = new AuthService();
const controller = new UserController(service,auth);

export const userRouters = new Hono();

userRouters.post('/signup', controller.signup);
userRouters.post('/signin', controller.signin);
userRouters.post("/signout", controller.signout);
userRouters.post("/refresh", controller.refresh);
 