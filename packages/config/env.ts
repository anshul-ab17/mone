import { z } from "zod";

class Env {
	private static instance: ReturnType<typeof Env.create>;
	private constructor() {}
	private	static create() {
		return z.object({
				DATABASE_URL: z.url(),
				JWT_SECRET: z.string().min(8),
				REDIS_URL: z.url(),
				PORT:z.coerce.number().default(3000)
		}).parse(process.env)
	}

	public static get(): ReturnType<typeof Env.create>{
		if(!this.instance){
			this.instance= this.create();
		}
		return this.instance;
	}
}

export const env = Env.get();
 