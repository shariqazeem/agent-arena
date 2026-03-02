import { ServiceType } from '@/types/agent';

export const AVALANCHE_FUJI_CHAIN_ID = 43113;
export const USDC_DECIMALS = 6;

export const AGENT_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const REPUTATION_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_REPUTATION_MANAGER_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x5425890298aed601595a70AB815c96711a31Bc65') as `0x${string}`;
export const X402_SERVER_URL = process.env.NEXT_PUBLIC_X402_SERVER_URL || 'http://localhost:4402';

export const SERVICE_TYPES: Record<ServiceType, { label: string; icon: string; color: string }> = {
  [ServiceType.DataAnalysis]: { label: 'Data Analysis', icon: '📊', color: 'text-foreground-secondary' },
  [ServiceType.NewsSummary]: { label: 'News Summary', icon: '📰', color: 'text-foreground-secondary' },
  [ServiceType.TradingSignal]: { label: 'Trading Signal', icon: '📈', color: 'text-foreground-secondary' },
  [ServiceType.Sentiment]: { label: 'Sentiment', icon: '🧠', color: 'text-foreground-secondary' },
};

export const NETWORK_BADGES = [
  { label: 'Avalanche Fuji' },
  { label: 'x402 Protocol' },
  { label: 'USDC' },
  { label: 'Chainlink' },
  { label: 'Kite AI' },
];
