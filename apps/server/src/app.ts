import { Hono } from "hono";
import { routes } from "./routes"
export const app = new Hono;

app.get('/health', (c)=>{
    return c.json({
        status:"OK"
    })
});
app.route('/api', routes);
