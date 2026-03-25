import { prisma } from "@repo/db";

export class OrderRepo {
    async create(data:any){
        return prisma.order.create({
            data,
        });
    }

    async findById(id:string){
        return prisma.order.findUnique({
            where:{ id}
        });
    }

    async update(id:string, data:any){
        return prisma.order.update({
            where:{ id},
            data
        });
    }

    async findUserOrders(userId:string){
        return prisma.order.findMany({
            where:{userId},
            orderBy:{ createdAt:"desc"}
        })
    }
}