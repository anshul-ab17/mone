import {z} from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url(),
	JWT_SECRET: z.string().min(8),
	REDIS_URL: z.url(),
	PORT:z.coerce.number().default(3000)
});


export const env = envSchema.parse(process.env)

