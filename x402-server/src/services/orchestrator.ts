import { runDataBot, type DataBotResult } from '../agents/dataBot.js';
import { runNewsBot, type NewsBotResult } from '../agents/newsBot.js';
import { runTraderBot, type TraderBotResult } from '../agents/traderBot.js';
import { activityLog } from './activityLog.js';
import { recordReputation } from './reputation.js';

export interface OrchestrationStep {
  step: number;
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  timestamp?: number;
  duration?: number;
  result?: unknown;
}

export interface OrchestrationResult {
  id: string;
  steps: OrchestrationStep[];
  tradingSignals: TraderBotResult | null;
  totalCost: string;
  duration: number;
  timestamp: number;
}

export async function runOrchestration(): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const orchestrationId = Math.random().toString(36).slice(2);
  const steps: OrchestrationStep[] = [];

  // Step 1: TraderBot initiates
  steps.push({
    step: 1,
    agent: 'TraderBot',
    action: 'Initiating orchestration — discovering data providers',
    status: 'complete',
    timestamp: Date.now(),
  });

  activityLog.add({
    type: 'orchestration',
    fromAgent: 'TraderBot',
    toAgent: 'System',
    amount: '0',
    description: 'TraderBot initiating orchestration',
  });

  // Step 2: x402 payment to DataBot
  steps.push({
    step: 2,
    agent: 'TraderBot',
    action: 'x402 payment to DataBot ($0.02 USDC)',
    status: 'complete',
    timestamp: Date.now(),
  });

  activityLog.add({
    type: 'x402_payment',
    fromAgent: 'TraderBot',
    toAgent: 'DataBot',
    amount: '0.02',
    description: 'x402 micropayment for crypto analysis',
  });

  // Step 3: DataBot fetches data
  let dataBotResult: DataBotResult;
  try {
    dataBotResult = await runDataBot();
    steps.push({
      step: 3,
      agent: 'DataBot',
      action: 'Fetched Chainlink feeds + CoinGecko market data',
      status: 'complete',
      timestamp: Date.now(),
      result: { summary: dataBotResult.summary },
    });

    activityLog.add({
      type: 'agent_call',
      fromAgent: 'DataBot',
      toAgent: 'Chainlink/CoinGecko',
      amount: '0',
      description: `DataBot: ${dataBotResult.summary.slice(0, 100)}...`,
    });

    // Record reputation for DataBot
    await recordReputation(0, '0x0000000000000000000000000000000000000000', true, 450);
    activityLog.add({
      type: 'reputation_update',
      fromAgent: 'System',
      toAgent: 'DataBot',
      amount: '0',
      description: 'DataBot reputation updated: success, rating 4.5/5',
    });
  } catch (err) {
    steps.push({ step: 3, agent: 'DataBot', action: 'Data fetch failed', status: 'error', timestamp: Date.now() });
    await recordReputation(0, '0x0000000000000000000000000000000000000000', false, 200);
    return {
      id: orchestrationId, steps, tradingSignals: null,
      totalCost: '0.02', duration: Date.now() - startTime, timestamp: startTime,
    };
  }

  // Step 4: x402 payment to NewsBot
  steps.push({
    step: 4,
    agent: 'TraderBot',
    action: 'x402 payment to NewsBot ($0.01 USDC)',
    status: 'complete',
    timestamp: Date.now(),
  });

  activityLog.add({
    type: 'x402_payment',
    fromAgent: 'TraderBot',
    toAgent: 'NewsBot',
    amount: '0.01',
    description: 'x402 micropayment for news summary',
  });

  // Step 5: NewsBot fetches and summarizes
  let newsBotResult: NewsBotResult;
  try {
    newsBotResult = await runNewsBot();
    steps.push({
      step: 5,
      agent: 'NewsBot',
      action: 'Fetched news + AI summary via Groq',
      status: 'complete',
      timestamp: Date.now(),
      result: { summary: newsBotResult.summary },
    });

    activityLog.add({
      type: 'agent_call',
      fromAgent: 'NewsBot',
      toAgent: 'NewsAPI/Groq',
      amount: '0',
      description: `NewsBot: ${newsBotResult.summary.slice(0, 100)}...`,
    });

    await recordReputation(1, '0x0000000000000000000000000000000000000000', true, 420);
  } catch (err) {
    steps.push({ step: 5, agent: 'NewsBot', action: 'News fetch failed', status: 'error', timestamp: Date.now() });
    await recordReputation(1, '0x0000000000000000000000000000000000000000', false, 200);
    return {
      id: orchestrationId, steps, tradingSignals: null,
      totalCost: '0.03', duration: Date.now() - startTime, timestamp: startTime,
    };
  }

  // Step 6: TraderBot merges with AI
  let traderBotResult: TraderBotResult;
  try {
    traderBotResult = await runTraderBot(dataBotResult, newsBotResult);
    steps.push({
      step: 6,
      agent: 'TraderBot',
      action: 'AI merge — generated trading signals via Groq',
      status: 'complete',
      timestamp: Date.now(),
      result: { signals: traderBotResult.signals, summary: traderBotResult.summary },
    });

    activityLog.add({
      type: 'agent_call',
      fromAgent: 'TraderBot',
      toAgent: 'Groq LLM',
      amount: '0',
      description: `TraderBot: ${traderBotResult.summary.slice(0, 100)}...`,
    });

    await recordReputation(2, '0x0000000000000000000000000000000000000000', true, 470);
  } catch (err) {
    steps.push({ step: 6, agent: 'TraderBot', action: 'AI merge failed', status: 'error', timestamp: Date.now() });
    await recordReputation(2, '0x0000000000000000000000000000000000000000', false, 200);
    return {
      id: orchestrationId, steps, tradingSignals: null,
      totalCost: '0.03', duration: Date.now() - startTime, timestamp: startTime,
    };
  }

  // Step 7: On-chain reputation recorded
  steps.push({
    step: 7,
    agent: 'System',
    action: 'On-chain reputation updated for all agents',
    status: 'complete',
    timestamp: Date.now(),
  });

  activityLog.add({
    type: 'orchestration',
    fromAgent: 'TraderBot',
    toAgent: 'System',
    amount: '0.03',
    description: `Orchestration complete: ${traderBotResult.signals.length} trading signals generated`,
  });

  return {
    id: orchestrationId,
    steps,
    tradingSignals: traderBotResult,
    totalCost: '0.03',
    duration: Date.now() - startTime,
    timestamp: startTime,
  };
}
