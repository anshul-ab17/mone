import type { Context } from "hono";
import { WalletService } from "../services/walletService"; 

export class WalletController {
    private service = new WalletService();

    public async getWallets(c:Context) {
        const user = c.get("user");

        const wallets = await this.service.getWallets(user.id);
        return c.json({
            success:true,
            data:wallets
        });
    }

    public async deposit(c:Context){
        const user = c.get("user");
        const body  = c.get("validateBody");

        const result = await this.service.deposit(
            user.id,
            body.asset,
            body.amount
        );

        return c.json({
            success:true,
            data:result
        })
    }
}