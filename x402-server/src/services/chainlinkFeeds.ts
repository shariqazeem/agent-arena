import { ethers } from 'ethers';

// Chainlink Price Feed ABI (AggregatorV3Interface)
const AGGREGATOR_ABI = [
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() external view returns (uint8)',
  'function description() external view returns (string)',
];

// Chainlink Price Feeds on Avalanche Fuji
const FEEDS: Record<string, string> = {
  'AVAX/USD': '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
  'BTC/USD': '0x31CF013A08c6Ac228C94551d535d5BAfE19c602a',
};

let provider: ethers.JsonRpcProvider | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    const rpc = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc';
    provider = new ethers.JsonRpcProvider(rpc);
  }
  return provider;
}

export interface PriceFeedData {
  pair: string;
  price: number;
  decimals: number;
  updatedAt: number;
  source: string;
}

export async function getChainlinkPrice(pair: string): Promise<PriceFeedData | null> {
  const feedAddress = FEEDS[pair];
  if (!feedAddress) return null;

  try {
    const contract = new ethers.Contract(feedAddress, AGGREGATOR_ABI, getProvider());
    const [, answer, , updatedAt] = await contract.latestRoundData();
    const decimals = await contract.decimals();

    const price = Number(answer) / Math.pow(10, Number(decimals));

    return {
      pair,
      price,
      decimals: Number(decimals),
      updatedAt: Number(updatedAt),
      source: `Chainlink ${pair} on Fuji (${feedAddress.slice(0, 10)}...)`,
    };
  } catch (err) {
    console.error(`Chainlink feed error for ${pair}:`, err);
    return null;
  }
}

export async function getAllChainlinkPrices(): Promise<PriceFeedData[]> {
  const results = await Promise.allSettled(
    Object.keys(FEEDS).map((pair) => getChainlinkPrice(pair))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<PriceFeedData | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((v): v is PriceFeedData => v !== null);
}
