
import { PrismaClient } from "@prisma/client"; 
import { PrismaPg } from "@prisma/adapter-pg";

class Database {
  private static instance: PrismaClient;
  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!this.instance) {
      const adapter = new PrismaPg({
        connectionString: process.env.DB_CONN_POOL
      });
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
