import { Router } from 'express';
import { getReputation } from '../services/reputation.js';

const DEMO_AGENTS = [
  {
    id: 0,
    name: 'DataBot',
    description: 'Real-time crypto market data from Chainlink oracles and CoinGecko. Provides AVAX/USD, BTC/USD prices and market metrics.',
    serviceType: 0,
    endpoint: '/api/agents/0/crypto-analysis',
    pricePerQuery: '0.02',
    isActive: true,
  },
  {
    id: 1,
    name: 'NewsBot',
    description: 'AI-powered news aggregation and summarization. Delivers concise crypto market news summaries using Groq LLM.',
    serviceType: 1,
    endpoint: '/api/agents/1/news-summary',
    pricePerQuery: '0.01',
    isActive: true,
  },
  {
    id: 2,
    name: 'TraderBot',
    description: 'Advanced trading signal generator. Orchestrates DataBot and NewsBot via x402 payments, merges insights with AI analysis.',
    serviceType: 2,
    endpoint: '/api/agents/2/trading-signal',
    pricePerQuery: '0.05',
    isActive: true,
  },
  {
    id: 3,
    name: 'SentimentBot',
    description: 'Market sentiment analysis powered by AI. Analyzes news and social signals to gauge market mood and fear/greed index.',
    serviceType: 3,
    endpoint: '/api/agents/3/sentiment-analysis',
    pricePerQuery: '0.03',
    isActive: true,
  },
];

export const agentsRouter = Router();

agentsRouter.get('/agents', async (_req, res) => {
  try {
    const agentsWithRep = await Promise.all(
      DEMO_AGENTS.map(async (agent) => {
        const rep = await getReputation(agent.id);
        return { ...agent, reputation: rep };
      })
    );
    res.json({ agents: agentsWithRep });
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.json({ agents: DEMO_AGENTS.map((a) => ({ ...a, reputation: { totalTxns: 0, successRate: 0, avgRating: 0, compositeScore: 0 } })) });
  }
});

agentsRouter.get('/agents/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const agent = DEMO_AGENTS.find((a) => a.id === id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  const reputation = await getReputation(id);
  res.json({ ...agent, reputation });
});
