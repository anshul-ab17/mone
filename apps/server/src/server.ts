import {app} from "./app";

Bun.serve({
    port:Number(process.env.PORT) || 3001,
    fetch:app.fetch
})