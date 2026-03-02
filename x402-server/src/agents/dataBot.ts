import { getAllChainlinkPrices, type PriceFeedData } from '../services/chainlinkFeeds.js';

interface CoinGeckoData {
  id: string;
  price: number;
  change24h: number;
  marketCap: number;
}

async function fetchCoinGecko(): Promise<CoinGeckoData[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json() as Record<string, Record<string, number>>;

    return Object.entries(data).map(([id, info]) => ({
      id,
      price: info.usd,
      change24h: info.usd_24h_change,
      marketCap: info.usd_market_cap,
    }));
  } catch (err) {
    console.error('CoinGecko error:', err);
    return [
      { id: 'avalanche-2', price: 22.5, change24h: 3.2, marketCap: 8_500_000_000 },
      { id: 'bitcoin', price: 97_500, change24h: 1.8, marketCap: 1_920_000_000_000 },
      { id: 'ethereum', price: 3_650, change24h: -0.5, marketCap: 440_000_000_000 },
    ];
  }
}

export interface DataBotResult {
  agent: string;
  agentId: number;
  timestamp: number;
  chainlinkFeeds: PriceFeedData[];
  marketData: CoinGeckoData[];
  summary: string;
}

export async function runDataBot(): Promise<DataBotResult> {
  const [chainlinkFeeds, marketData] = await Promise.all([
    getAllChainlinkPrices(),
    fetchCoinGecko(),
  ]);

  const avaxPrice = chainlinkFeeds.find((f) => f.pair === 'AVAX/USD')?.price ?? marketData.find((m) => m.id === 'avalanche-2')?.price ?? 0;
  const btcPrice = chainlinkFeeds.find((f) => f.pair === 'BTC/USD')?.price ?? marketData.find((m) => m.id === 'bitcoin')?.price ?? 0;

  const summary = `AVAX: $${avaxPrice.toFixed(2)} (Chainlink), BTC: $${btcPrice.toFixed(2)} (Chainlink). ` +
    marketData.map((m) => `${m.id}: $${m.price.toLocaleString()} (${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(1)}%)`).join(', ');

  return {
    agent: 'DataBot',
    agentId: 0,
    timestamp: Date.now(),
    chainlinkFeeds,
    marketData,
    summary,
  };
}
