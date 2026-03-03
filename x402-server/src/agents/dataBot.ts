import Groq from 'groq-sdk';
import { getAllChainlinkPrices, type PriceFeedData } from '../services/chainlinkFeeds.js';

interface CoinGeckoData {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
}

const COINGECKO_IDS = 'avalanche-2,bitcoin,ethereum,chainlink';

async function fetchCoinGecko(): Promise<CoinGeckoData[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd&include_24hr_change=true&include_7d_change=true&include_market_cap=true&include_24hr_vol=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json() as Record<string, Record<string, number>>;

    const symbolMap: Record<string, string> = {
      'avalanche-2': 'AVAX',
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'chainlink': 'LINK',
    };

    return Object.entries(data).map(([id, info]) => ({
      id,
      symbol: symbolMap[id] || id.toUpperCase(),
      price: info.usd,
      change24h: info.usd_24h_change ?? 0,
      change7d: info.usd_7d_change ?? 0,
      marketCap: info.usd_market_cap ?? 0,
      volume24h: info.usd_24h_vol ?? 0,
    }));
  } catch (err) {
    console.warn('CoinGecko fetch failed, using Chainlink-only mode:', (err as Error).message);
    return [];
  }
}

async function generateAIAnalysis(
  chainlinkFeeds: PriceFeedData[],
  marketData: CoinGeckoData[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return buildBasicSummary(chainlinkFeeds, marketData);
  }

  try {
    const groq = new Groq({ apiKey });

    const feedsText = chainlinkFeeds
      .map((f) => `${f.pair}: $${f.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} (Chainlink oracle, updated ${new Date(f.updatedAt * 1000).toISOString()})`)
      .join('\n');

    const marketText = marketData
      .map((m) => `${m.symbol}: $${m.price.toLocaleString()} | 24h: ${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(2)}% | 7d: ${m.change7d > 0 ? '+' : ''}${m.change7d.toFixed(2)}% | Vol: $${(m.volume24h / 1e9).toFixed(2)}B | MCap: $${(m.marketCap / 1e9).toFixed(1)}B`)
      .join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are DataBot, an on-chain data analyst for the Agent Arena marketplace on Avalanche. You specialize in:
- Cross-referencing Chainlink decentralized oracle prices with CoinGecko market data
- Identifying price discrepancies between on-chain and off-chain sources
- Detecting unusual volume patterns and momentum shifts
- Providing actionable data insights for other AI agents (TraderBot, SentimentBot)

Your analysis is paid for via x402 micropayments (USDC on Avalanche). Deliver premium, concise data intelligence in 3-4 sentences. Flag any oracle/market price divergence. Note key volume and momentum signals.`,
        },
        {
          role: 'user',
          content: `Analyze this live market data:\n\nChainlink Oracle Feeds (Avalanche Fuji):\n${feedsText || 'No feeds available'}\n\nCoinGecko Market Data:\n${marketText || 'No market data available'}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || buildBasicSummary(chainlinkFeeds, marketData);
  } catch (err) {
    console.error('DataBot AI analysis error:', err);
    return buildBasicSummary(chainlinkFeeds, marketData);
  }
}

function buildBasicSummary(feeds: PriceFeedData[], market: CoinGeckoData[]): string {
  const parts: string[] = [];
  for (const f of feeds) {
    parts.push(`${f.pair}: $${f.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} (Chainlink)`);
  }
  for (const m of market) {
    if (!feeds.some((f) => f.pair.startsWith(m.symbol))) {
      parts.push(`${m.symbol}: $${m.price.toLocaleString()} (${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(1)}%)`);
    }
  }
  return parts.join(' | ');
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

  const summary = await generateAIAnalysis(chainlinkFeeds, marketData);

  return {
    agent: 'DataBot',
    agentId: 0,
    timestamp: Date.now(),
    chainlinkFeeds,
    marketData,
    summary,
  };
}
