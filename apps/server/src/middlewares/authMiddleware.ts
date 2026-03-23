import { Context, Next} from "hono"; 

export class AuthMiddleware {
    private authService = new AuthService();

    public handler = async (c:Context, next:Next) =>{
        const cookie = c.req.header("cookie");

        if(!cookie){
            return c.json({
                error:"Unauthorized"
            },401);
        }
        const sessionId = cookie.split("=")[1];
        const userId = await this.authService.validate(sessionId);

        if(!userId){
            return c.json({
                error:"Unauthorized"
            },401)
        }
        c.set("userId", userId);
        await next();
    }
}