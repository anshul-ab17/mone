import { Hono } from "hono";
import { routes } from "./routes";
import { errorMiddleware } from "./middlewares/errorMiddleware";

export const app = new Hono();

app.use("*", errorMiddleware);

app.get('/health', (c)=>{
    return c.json({
        status:"OK"
    })
});
app.route('/api', routes);

export default app;