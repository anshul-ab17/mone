import { Hono } from "hono";
import { cors } from "hono/cors";
import { routes } from "./routes";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { wsRoute } from "./ws/wsHandler";
import { env } from "@repo/config";

export const app = new Hono();

app.use("*", cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use("*", errorMiddleware);

app.get('/health', (c) => c.json({ status: "OK" }));
app.get('/ws', wsRoute);
app.route('/api', routes);

export default app;
