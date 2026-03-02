export enum ServiceType {
  DataAnalysis = 0,
  NewsSummary = 1,
  TradingSignal = 2,
  Sentiment = 3,
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  serviceType: ServiceType;
  endpoint: string;
  pricePerQuery: string;
  isActive: boolean;
  owner?: string;
  registeredAt?: number;
  reputation: AgentReputation;
}

export interface AgentReputation {
  totalTxns: number;
  successRate: number; // bps 0-10000
  avgRating: number; // 100-500
  compositeScore: number; // 0-1000
}

export interface ActivityRecord {
  id: string;
  type: 'x402_payment' | 'agent_call' | 'orchestration' | 'reputation_update';
  fromAgent: string;
  toAgent: string;
  amount: string;
  description: string;
  txHash?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationStep {
  step: number;
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  timestamp?: number;
  duration?: number;
  result?: Record<string, unknown>;
}

export interface OrchestrationResult {
  id: string;
  steps: OrchestrationStep[];
  tradingSignals: {
    agent: string;
    agentId: number;
    signals: Array<{
      asset: string;
      action: 'BUY' | 'SELL' | 'HOLD';
      confidence: number;
      reasoning: string;
    }>;
    summary: string;
  } | null;
  totalCost: string;
  duration: number;
  timestamp: number;
}
