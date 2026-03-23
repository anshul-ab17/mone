import { PrismaClient } from "@prisma/client";
class Database {
  private static instance: PrismaClient;
  private constructor() {}
  
  public static getInstance(): PrismaClient{
    if(!this.instance){
      this.instance= new PrismaClient({
        log:process.env.NODE_ENV=="production" ?["error"]: ["query","warn","error"]
      });
    }
    return this.instance;
  }
}

export const prisma = Database.getInstance();
