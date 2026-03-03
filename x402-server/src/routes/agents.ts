import { Router } from 'express';
import { getReputation } from '../services/reputation.js';
import { getAgentWallet } from '../services/agentWallets.js';
import { getOnChainAgents, getOnChainAgent } from '../services/agentRegistry.js';
import { activityLog } from '../services/activityLog.js';

// Fallback agents for when chain reads fail
const FALLBACK_AGENTS = [
  {
    id: 0, name: 'DataBot', description: 'Real-time crypto market data from Chainlink oracles and CoinGecko.',
    serviceType: 0, endpoint: '/api/agents/0/crypto-analysis', pricePerQuery: '0.02', isActive: true,
    owner: '0x0000000000000000000000000000000000000000', registeredAt: 0,
  },
  {
    id: 1, name: 'NewsBot', description: 'AI-powered news aggregation and summarization via Groq LLM.',
    serviceType: 1, endpoint: '/api/agents/1/news-summary', pricePerQuery: '0.01', isActive: true,
    owner: '0x0000000000000000000000000000000000000000', registeredAt: 0,
  },
  {
    id: 2, name: 'TraderBot', description: 'Lead AI trading strategist. Orchestrates DataBot and NewsBot via x402 payments.',
    serviceType: 2, endpoint: '/api/agents/2/trading-signal', pricePerQuery: '0.05', isActive: true,
    owner: '0x0000000000000000000000000000000000000000', registeredAt: 0,
  },
  {
    id: 3, name: 'SentimentBot', description: 'Market psychology analyst combining Fear & Greed Index and trending analysis.',
    serviceType: 3, endpoint: '/api/agents/3/sentiment-analysis', pricePerQuery: '0.03', isActive: true,
    owner: '0x0000000000000000000000000000000000000000', registeredAt: 0,
  },
];

// Built-in capabilities (not stored on-chain)
const BUILTIN_CAPABILITIES: Record<number, string[]> = {
  0: ['chainlink-price-feeds', 'coingecko-market-data', 'price-divergence-detection', 'volume-analysis'],
  1: ['news-aggregation', 'ai-summarization', 'sentiment-extraction', 'trending-detection'],
  2: ['multi-agent-orchestration', 'trading-signal-generation', 'risk-assessment', 'x402-agent-payments'],
  3: ['fear-greed-index', 'trending-coin-analysis', 'news-sentiment', 'contrarian-signals'],
};

export const agentsRouter = Router();

agentsRouter.get('/agents', async (_req, res) => {
  try {
    let agents = await getOnChainAgents();

    // Graceful degradation — use fallback if chain returns nothing
    if (agents.length === 0) {
      agents = FALLBACK_AGENTS;
    }

    const agentsWithMeta = await Promise.all(
      agents.map(async (agent) => {
        const rep = await getReputation(agent.id);
        return {
          ...agent,
          capabilities: BUILTIN_CAPABILITIES[agent.id] || [],
          reputation: rep,
        };
      })
    );
    res.json({ agents: agentsWithMeta });
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.json({
      agents: FALLBACK_AGENTS.map((a) => ({
        ...a,
        capabilities: BUILTIN_CAPABILITIES[a.id] || [],
        reputation: { totalTxns: 0, successRate: 0, avgRating: 0, compositeScore: 0 },
      })),
    });
  }
});

agentsRouter.get('/agents/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    let agent = await getOnChainAgent(id);

    // Fallback for built-in agents
    if (!agent) {
      const fallback = FALLBACK_AGENTS.find((a) => a.id === id);
      if (!fallback) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }
      agent = fallback;
    }

    const reputation = await getReputation(id);
    res.json({
      ...agent,
      capabilities: BUILTIN_CAPABILITIES[id] || [],
      reputation,
    });
  } catch (err) {
    console.error(`Error fetching agent ${id}:`, err);
    const fallback = FALLBACK_AGENTS.find((a) => a.id === id);
    if (!fallback) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    const reputation = await getReputation(id);
    res.json({
      ...fallback,
      capabilities: BUILTIN_CAPABILITIES[id] || [],
      reputation,
    });
  }
});

// Built-in agent name fallback (for when chain reads fail)
const BUILTIN_AGENT_NAMES: Record<number, string> = { 0: 'DataBot', 1: 'NewsBot', 2: 'TraderBot', 3: 'SentimentBot' };

// Agent earnings — sums x402 payments from activity log
agentsRouter.get('/agents/:id/earnings', async (req, res) => {
  const id = parseInt(req.params.id);

  // Resolve agent name dynamically — works for any agent ID
  let agentName: string | null = BUILTIN_AGENT_NAMES[id] || null;
  try {
    const agent = await getOnChainAgent(id);
    if (agent) agentName = agent.name;
  } catch {
    // Keep fallback name
  }

  const allActivities = activityLog.getAll(200);

  // Match payments by agent name (both x402_payment and legacy agent_call types)
  const payments = allActivities.filter(
    (a) =>
      (a.type === 'x402_payment' || a.type === 'agent_call') &&
      agentName !== null &&
      a.toAgent === agentName
  );

  // Only count non-withdrawn payments for withdrawable amount
  const withdrawable = payments
    .filter((a) => !a.metadata?.withdrawn)
    .reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0);

  const totalEarnings = payments.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0);

  res.json({
    agentId: id,
    agentName,
    totalEarnings: totalEarnings.toFixed(4),
    withdrawableEarnings: withdrawable.toFixed(4),
    paymentCount: payments.length,
    recentPayments: payments.slice(0, 20).map((p) => ({
      amount: p.amount,
      from: p.fromAgent,
      description: p.description,
      txHash: p.txHash,
      timestamp: p.timestamp,
      withdrawn: !!p.metadata?.withdrawn,
    })),
  });
});

// A2A-style Agent Card
agentsRouter.get('/agents/:id/agent-card', async (req, res) => {
  const id = parseInt(req.params.id);

  let agent = await getOnChainAgent(id);
  if (!agent) {
    const fallback = FALLBACK_AGENTS.find((a) => a.id === id);
    if (!fallback) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    agent = fallback;
  }

  const capabilities = BUILTIN_CAPABILITIES[id] || [];
  const wallet = getAgentWallet(id);
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    name: agent.name,
    description: agent.description,
    url: `${baseUrl}${agent.endpoint}`,
    provider: { organization: 'Agent Arena', url: baseUrl },
    version: '1.0.0',
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    authentication: { schemes: ['x402'], credentials: null },
    payment: {
      protocol: 'x402',
      network: 'avalanche-fuji',
      currency: 'USDC',
      pricePerQuery: agent.pricePerQuery,
      payTo: process.env.SERVER_WALLET_ADDRESS,
    },
    identity: {
      wallet: wallet?.address || null,
      owner: agent.owner,
      chainId: 43113,
      nftRegistry: process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS,
      tokenId: agent.id,
    },
    skills: capabilities.map((cap) => ({
      id: cap,
      name: cap.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: `${agent!.name} capability: ${cap}`,
    })),
    defaultInputModes: ['application/json'],
    defaultOutputModes: ['application/json'],
  });
});

// Discovery endpoint — all Agent Cards
agentsRouter.get('/agents-directory', async (_req, res) => {
  const baseUrl = `http://localhost:${process.env.X402_PORT || 4402}`;

  let agents = await getOnChainAgents();
  if (agents.length === 0) {
    agents = FALLBACK_AGENTS;
  }

  res.json({
    name: 'Agent Arena',
    description: 'AI Agent Marketplace on Avalanche — agents trade intelligence via x402 micropayments',
    version: '1.0.0',
    network: 'avalanche-fuji',
    protocols: ['x402', 'ERC-8004'],
    agents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      endpoint: `${baseUrl}${agent.endpoint}`,
      agentCard: `${baseUrl}/api/agents/${agent.id}/agent-card`,
      pricePerQuery: agent.pricePerQuery,
      capabilities: BUILTIN_CAPABILITIES[agent.id] || [],
      isActive: agent.isActive,
      owner: agent.owner,
    })),
  });
});
