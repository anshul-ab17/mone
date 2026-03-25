import { WalletRepo } from "../repo/walletRepo";

export class WalletService{
    private repo= new WalletRepo();

    public async getWallets(userId:string){
        return this.repo.getUserWallet(userId);
    }

    public async deposit(userId:string, asset:string, amount:number){
        let wallet= await this.repo.findWallet(userId, asset);
        
        if(!wallet){
            await this.repo.createWallet(userId, asset);
        }

        return this.repo.updateWallet(userId, asset, amount);
    }
}

// add transaction logs
// prevent abuse
// blockchain integration