import { prisma } from "@repo/db";

export class UserRepo {
  public async create(email: string, password: string) {
    return prisma.user.create({ data: { email, password } });
  }

  public async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
}