import { ethers } from 'ethers';

const REPUTATION_ABI = [
  'function recordTransaction(uint256 agentId, address caller, bool success, uint256 rating) external',
  'function getReputation(uint256 agentId) external view returns (uint256 totalTxns, uint256 successRate, uint256 avgRating, uint256 compositeScore)',
];

let contract: ethers.Contract | null = null;

function getContract(): ethers.Contract | null {
  if (contract) return contract;

  const address = process.env.REPUTATION_MANAGER_ADDRESS;
  const privateKey = process.env.SERVER_PRIVATE_KEY;
  const rpc = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc';

  if (!address || !privateKey) {
    console.warn('ReputationManager not configured — skipping on-chain reputation');
    return null;
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(privateKey, provider);
  contract = new ethers.Contract(address, REPUTATION_ABI, signer);
  return contract;
}

export async function recordReputation(
  agentId: number,
  caller: string,
  success: boolean,
  rating: number
): Promise<string | null> {
  const c = getContract();
  if (!c) return null;

  try {
    const tx = await c.recordTransaction(agentId, caller, success, rating);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    console.error('Failed to record reputation:', err);
    return null;
  }
}

export async function getReputation(agentId: number) {
  const c = getContract();
  if (!c) {
    return { totalTxns: 0, successRate: 0, avgRating: 0, compositeScore: 0 };
  }

  try {
    const [totalTxns, successRate, avgRating, compositeScore] = await c.getReputation(agentId);
    return {
      totalTxns: Number(totalTxns),
      successRate: Number(successRate),
      avgRating: Number(avgRating),
      compositeScore: Number(compositeScore),
    };
  } catch (err) {
    console.error('Failed to get reputation:', err);
    return { totalTxns: 0, successRate: 0, avgRating: 0, compositeScore: 0 };
  }
}
