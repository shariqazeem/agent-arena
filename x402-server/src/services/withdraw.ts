import { ethers } from 'ethers';

const USDC_ADDRESS = '0x5425890298aed601595a70AB815c96711a31Bc65'; // Fuji testnet USDC
const USDC_ABI = ['function transfer(address to, uint256 amount) external returns (bool)'];

/**
 * Transfers USDC from the server wallet to an agent owner's address.
 * Uses SERVER_PRIVATE_KEY to sign the transaction.
 */
export async function withdrawEarnings(
  ownerAddress: string,
  amountUSDC: number,
): Promise<{ txHash: string; amount: string }> {
  const privateKey = process.env.SERVER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SERVER_PRIVATE_KEY not configured');
  }

  const rpc = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc';
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

  // Convert to micro-USDC (6 decimals)
  const microUSDC = BigInt(Math.round(amountUSDC * 1e6));

  const tx = await usdc.transfer(ownerAddress, microUSDC);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    amount: amountUSDC.toFixed(4),
  };
}
