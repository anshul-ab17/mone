import {app} from "./app";
import { env } from "@repo/config";

Bun.serve({
    port:Number(env.PORT) || 3001,
    fetch:app.fetch
})

console.log(`server is running on :${env.PORT}`); 

