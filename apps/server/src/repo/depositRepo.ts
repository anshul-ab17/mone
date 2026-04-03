import { prisma } from "@repo/db";

export class DepositRepo {
  async findOrCreateAddress(userId: string, publicKey: string) {
    return prisma.depositAddress.upsert({
      where: { userId },
      update: {},
      create: { userId, publicKey },
    });
  }

  async findAddressForUser(userId: string) {
    return prisma.depositAddress.findUnique({ where: { userId } });
  }

  async getAllAddresses() {
    return prisma.depositAddress.findMany({ select: { userId: true, publicKey: true } });
  }

  async isTxProcessed(signature: string) {
    const tx = await prisma.processedTx.findUnique({ where: { signature } });
    return tx !== null;
  }

  async recordTx(signature: string, userId: string, amount: number, asset = "SOL") {
    await prisma.processedTx.create({ data: { signature, userId, amount, asset } });
  }

  async getUserHistory(userId: string) {
    return prisma.processedTx.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
