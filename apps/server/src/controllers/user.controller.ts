import { Context } from "hono";
import * as userService from "../services/user.service";

export const getUser = async (c: Context) =>{
	const id = c.req.param("id");

	const user = await userService.getUserById(id);

	return c.json(user);
};
