import { prisma } from "@repo/db";

export class WithdrawalRepo {
  async create(userId: string, destinationAddress: string, amount: number, asset = "SOL") {
    return prisma.withdrawal.create({
      data: { userId, destinationAddress, amount, asset, status: "PENDING" },
    });
  }

  async updateStatus(id: string, status: string, txSignature?: string) {
    return prisma.withdrawal.update({
      where: { id },
      data: { status: status as never, ...(txSignature ? { txSignature } : {}) },
    });
  }

  async getUserHistory(userId: string) {
    return prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
