import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { paymentMiddleware } from 'x402-express';
import type { Resource } from 'x402-express';
import { agentsRouter } from './routes/agents.js';
import { activityRouter } from './routes/activity.js';
import { runDataBot } from './agents/dataBot.js';
import { runNewsBot } from './agents/newsBot.js';
import { runTraderBot } from './agents/traderBot.js';
import { runSentimentBot } from './agents/sentimentBot.js';
import { runOrchestration } from './services/orchestrator.js';
import { activityLog } from './services/activityLog.js';
import { startDemoLoop } from './services/demoLoop.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.X402_PORT || 4402;

const payTo = (process.env.SERVER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const facilitatorUrl = (process.env.X402_FACILITATOR_URL || 'https://x402.0xgasless.com') as Resource;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agent-arena-x402-server', network: 'avalanche-fuji' });
});

// x402 payment middleware — protects agent service endpoints
app.use(
  paymentMiddleware(
    payTo,
    {
      'GET /api/agents/0/crypto-analysis': {
        price: '$0.02',
        network: 'avalanche-fuji',
        config: { description: 'DataBot — Chainlink + CoinGecko crypto analysis' },
      },
      'GET /api/agents/1/news-summary': {
        price: '$0.01',
        network: 'avalanche-fuji',
        config: { description: 'NewsBot — AI-powered news summary' },
      },
      'GET /api/agents/2/trading-signal': {
        price: '$0.05',
        network: 'avalanche-fuji',
        config: { description: 'TraderBot — Orchestrated trading signals' },
      },
      'GET /api/agents/3/sentiment-analysis': {
        price: '$0.03',
        network: 'avalanche-fuji',
        config: { description: 'SentimentBot — Market sentiment analysis' },
      },
    },
    { url: facilitatorUrl }
  )
);

// x402-protected agent endpoints
app.get('/api/agents/0/crypto-analysis', async (_req, res) => {
  try {
    const result = await runDataBot();
    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'Client',
      toAgent: 'DataBot',
      amount: '0.02',
      description: 'x402 payment for crypto analysis',
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'DataBot analysis failed' });
  }
});

app.get('/api/agents/1/news-summary', async (_req, res) => {
  try {
    const result = await runNewsBot();
    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'Client',
      toAgent: 'NewsBot',
      amount: '0.01',
      description: 'x402 payment for news summary',
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'NewsBot summary failed' });
  }
});

app.get('/api/agents/2/trading-signal', async (_req, res) => {
  try {
    const dataResult = await runDataBot();
    const newsResult = await runNewsBot();
    const result = await runTraderBot(dataResult, newsResult);
    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'Client',
      toAgent: 'TraderBot',
      amount: '0.05',
      description: 'x402 payment for trading signal',
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'TraderBot signal failed' });
  }
});

app.get('/api/agents/3/sentiment-analysis', async (_req, res) => {
  try {
    const result = await runSentimentBot();
    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'Client',
      toAgent: 'SentimentBot',
      amount: '0.03',
      description: 'x402 payment for sentiment analysis',
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'SentimentBot analysis failed' });
  }
});

// Demo hire endpoint — bypasses x402 for hackathon demo
// The x402 protocol is still demonstrated via agent-to-agent orchestration
const agentRunners = [
  { name: 'DataBot', run: () => runDataBot(), price: '0.02' },
  { name: 'NewsBot', run: () => runNewsBot(), price: '0.01' },
  { name: 'TraderBot', run: async () => {
    const data = await runDataBot();
    const news = await runNewsBot();
    return runTraderBot(data, news);
  }, price: '0.05' },
  { name: 'SentimentBot', run: () => runSentimentBot(), price: '0.03' },
];

app.post('/api/hire/:agentId', async (req, res) => {
  const id = parseInt(req.params.agentId);
  const runner = agentRunners[id];
  if (!runner) return res.status(404).json({ error: 'Agent not found' });

  try {
    const result = await runner.run();
    activityLog.add({
      type: 'agent_call',
      fromAgent: 'Client',
      toAgent: runner.name,
      amount: runner.price,
      description: `Hired ${runner.name} via demo mode`,
    });
    res.json(result);
  } catch (err) {
    console.error(`Hire ${runner.name} failed:`, err);
    res.status(500).json({ error: `${runner.name} execution failed` });
  }
});

// Public API routes
app.use('/api', agentsRouter);
app.use('/api', activityRouter);

// Orchestration endpoint
app.post('/api/orchestrate', async (_req, res) => {
  try {
    const result = await runOrchestration();
    res.json(result);
  } catch (err) {
    console.error('Orchestration error:', err);
    res.status(500).json({ error: 'Orchestration failed' });
  }
});

// Create HTTP server and attach WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  activityLog.addClient(ws);
  ws.send(JSON.stringify({ type: 'connected', message: 'Agent Arena live feed' }));
});

server.listen(PORT, () => {
  console.log(`Agent Arena x402 Server running on port ${PORT}`);
  console.log(`Pay-to wallet: ${payTo}`);
  console.log(`Facilitator: ${facilitatorUrl}`);
  console.log(`Network: avalanche-fuji`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);

  // Start demo loop (auto-orchestrate every 60s)
  if (process.env.DEMO_LOOP !== 'false') {
    startDemoLoop(60_000);
  }
});
