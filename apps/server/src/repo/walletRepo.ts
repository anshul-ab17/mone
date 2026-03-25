import { prisma } from "@repo/db";

export class WalletRepo{
    public async findWallet(userId:string, asset:string){
        return prisma.wallet.findUnique({
            where:{
                userId_asset:{
                    userId,
                    asset
                }
            }
        })
    }

    public async createWallet(userId:string, asset:string){
        return prisma.wallet.create({
            data:{
                userId,
                asset,
                balance:0
            }
        });
    }

    public async updateWallet(userId:string, asset:string, amount:number){
        return prisma.wallet.update({
            where:{
                userId_asset:{userId, asset}
            },
            data:{
                balance:{
                    increment:amount
                }
            }
        });
    }

    public async getUserWallet(userId:string){
        return prisma.wallet.findMany({
            where:{
                userId
            }
        });
    }

}