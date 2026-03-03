import { ethers } from 'ethers';

const AGENT_REGISTRY_ABI = [
  'function getActiveAgents() external view returns (uint256[] memory)',
  'function getAgent(uint256 agentId) external view returns (string name, string description, uint8 serviceType, string endpoint, uint256 pricePerQuery, address owner, bool isActive, uint256 registeredAt)',
  'function nextAgentId() external view returns (uint256)',
];

const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0x7940F1fb812D1889A7859e1C9bB932Da566b910f';

let provider: ethers.JsonRpcProvider | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    const rpc = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc';
    provider = new ethers.JsonRpcProvider(rpc);
  }
  return provider;
}

function getContract(): ethers.Contract {
  return new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, getProvider());
}

export interface OnChainAgent {
  id: number;
  name: string;
  description: string;
  serviceType: number;
  endpoint: string;
  pricePerQuery: string; // decimal string e.g. "0.02"
  owner: string;
  isActive: boolean;
  registeredAt: number;
}

// 30-second cache
let cachedAgents: OnChainAgent[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

export function invalidateAgentCache() {
  cachedAgents = null;
  cacheTimestamp = 0;
}

export async function getOnChainAgent(agentId: number): Promise<OnChainAgent | null> {
  try {
    const contract = getContract();
    const [name, description, serviceType, endpoint, pricePerQuery, owner, isActive, registeredAt] =
      await contract.getAgent(agentId);

    // If owner is zero address, agent doesn't exist
    if (owner === ethers.ZeroAddress) return null;

    return {
      id: agentId,
      name,
      description,
      serviceType: Number(serviceType),
      endpoint,
      pricePerQuery: (Number(pricePerQuery) / 1e6).toFixed(2), // micro-USDC → decimal
      owner,
      isActive,
      registeredAt: Number(registeredAt),
    };
  } catch (err) {
    console.error(`Failed to fetch agent ${agentId} from chain:`, err);
    return null;
  }
}

export async function getOnChainAgents(): Promise<OnChainAgent[]> {
  // Return cache if fresh
  if (cachedAgents && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedAgents;
  }

  try {
    const contract = getContract();
    const activeIds: bigint[] = await contract.getActiveAgents();

    const agents = await Promise.all(
      activeIds.map((id) => getOnChainAgent(Number(id)))
    );

    cachedAgents = agents.filter((a): a is OnChainAgent => a !== null);
    cacheTimestamp = Date.now();
    return cachedAgents;
  } catch (err) {
    console.error('Failed to fetch agents from chain:', err);
    // Return stale cache if available
    if (cachedAgents) return cachedAgents;
    return [];
  }
}
