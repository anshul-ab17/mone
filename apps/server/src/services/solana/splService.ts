import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Returns the platform's ATA for a given deposit keypair + mint.
// This is the address users must send SPL tokens to.
export async function getDepositTokenAddress(
  depositKeypair: Keypair,
  mintAddress: string
): Promise<PublicKey> {
  const mint = new PublicKey(mintAddress);
  return getAssociatedTokenAddress(mint, depositKeypair.publicKey);
}

// Returns the current SPL token balance (in UI units, accounting for decimals).
export async function getSplBalance(
  connection: Connection,
  ataAddress: PublicKey
): Promise<number> {
  try {
    const account = await getAccount(connection, ataAddress, "confirmed");
    return Number(account.amount);
  } catch {
    return 0; // account doesn't exist → zero balance
  }
}

// Transfers SPL tokens from sender's ATA to destination ATA.
// Creates destination ATA if it doesn't exist (idempotent instruction).
export async function transferSpl(
  connection: Connection,
  senderKeypair: Keypair,
  mintAddress: string,
  destinationOwner: PublicKey,
  lamportAmount: bigint // raw token units (factored by mint decimals)
): Promise<string> {
  const mint = new PublicKey(mintAddress);

  const senderAta = await getAssociatedTokenAddress(mint, senderKeypair.publicKey);
  const destinationAta = await getAssociatedTokenAddress(mint, destinationOwner);

  const tx = new Transaction();

  // Ensure destination ATA exists (no-op if already created)
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      senderKeypair.publicKey, // fee payer
      destinationAta,
      destinationOwner,
      mint
    )
  );

  tx.add(
    createTransferInstruction(
      senderAta,
      destinationAta,
      senderKeypair.publicKey,
      lamportAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return sendAndConfirmTransaction(connection, tx, [senderKeypair]);
}
