import bs58 from 'bs58';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
} from '@solana/spl-token';

/** Mints a 1-of-1 SPL token (recipe card) to the player's wallet on devnet/mainnet. */
export async function mintRecipeTokenToWallet({ recipientWallet }) {
  const secret = process.env.MINTER_SECRET_KEY;
  const rpc = process.env.SOLANA_RPC || 'https://api.devnet.solana.com';
  if (!secret) return { ok: false, reason: 'On-chain minting is not configured (MINTER_SECRET_KEY).' };

  const payer = Keypair.fromSecretKey(bs58.decode(secret));
  const connection = new Connection(rpc, 'confirmed');
  const recipient = new PublicKey(recipientWallet);
  const mintKeypair = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const ata = getAssociatedTokenAddressSync(mintKeypair.publicKey, recipient);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(mintKeypair.publicKey, 0, payer.publicKey, payer.publicKey, TOKEN_PROGRAM_ID),
    createAssociatedTokenAccountInstruction(payer.publicKey, ata, recipient, mintKeypair.publicKey),
    createMintToInstruction(mintKeypair.publicKey, ata, payer.publicKey, 1)
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair], {
    commitment: 'confirmed',
  });

  return {
    ok: true,
    mint: mintKeypair.publicKey.toBase58(),
    signature,
    network: process.env.NFT_NETWORK || 'devnet',
  };
}
