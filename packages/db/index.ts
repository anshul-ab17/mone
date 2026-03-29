
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

class Database {
  private static instance: PrismaClient;
  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!this.instance) {
      // Pass an explicit Pool so PrismaPg reuses the same pool on every connect()
      // call. Passing a connectionString string causes PrismaPg to create a new
      // pg.Pool on each connect(), which exhausts connections under load.
      // Use direct Postgres (DATABASE_URL) — PgBouncer (DB_CONN_POOL) is
      // reserved for production scaling and is not compatible with Prisma's
      // driver adapter when Postgres 15 uses scram-sha-256 auth.
      const connectionString = process.env.DATABASE_URL ?? process.env.DB_CONN_POOL;
      const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 3000 });
      const adapter = new PrismaPg(pool);
      this.instance = new PrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === "production"
            ? ["error"]
            : ["query", "warn", "error"],
      });
    }
    return this.instance;
  }
}

export const prisma = Database.getInstance();
