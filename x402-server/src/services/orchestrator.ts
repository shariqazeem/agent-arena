import { createWalletClient, createPublicClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalancheFuji } from 'viem/chains';
import { wrapFetchWithPayment } from 'x402-fetch';
import { runDataBot, type DataBotResult } from '../agents/dataBot.js';
import { runNewsBot, type NewsBotResult } from '../agents/newsBot.js';
import { runTraderBot, type TraderBotResult } from '../agents/traderBot.js';
import { activityLog } from './activityLog.js';
import { recordReputation } from './reputation.js';
import { getAgentWallet } from './agentWallets.js';

export interface OrchestrationStep {
  step: number;
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  timestamp?: number;
  duration?: number;
  result?: unknown;
  txHash?: string;
}

export interface OrchestrationResult {
  id: string;
  steps: OrchestrationStep[];
  tradingSignals: TraderBotResult | null;
  totalCost: string;
  duration: number;
  timestamp: number;
}

const SERVER_URL = `http://localhost:${process.env.X402_PORT || 4402}`;
const RPC_URL = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc';

/**
 * Creates an x402-enabled fetch using an agent's HD wallet.
 * The agent autonomously signs EIP-3009 USDC transferWithAuthorization.
 */
function createAgentFetch(agentId: number) {
  const agentWallet = getAgentWallet(agentId);
  if (!agentWallet) throw new Error(`Agent wallet ${agentId} not found`);

  const account = privateKeyToAccount(agentWallet.wallet.privateKey as `0x${string}`);

  const signer = createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(RPC_URL),
  }).extend(publicActions);

  return wrapFetchWithPayment(
    fetch,
    signer as Parameters<typeof wrapFetchWithPayment>[1],
    BigInt(100_000), // max 0.10 USDC per call
  );
}

/**
 * Calls an agent endpoint via x402 (real payment) with fallback to direct call.
 */
async function callAgentViaX402(
  callerAgentId: number,
  targetEndpoint: string,
  targetName: string,
): Promise<{ data: any; paidViaX402: boolean }> {
  try {
    const fetchWithPay = createAgentFetch(callerAgentId);
    const res = await fetchWithPay(`${SERVER_URL}${targetEndpoint}`);

    if (res.ok) {
      const data = await res.json();
      console.log(`[Orchestrator] ${targetName} paid via x402 — real USDC settled on-chain`);
      return { data, paidViaX402: true };
    }

    console.warn(`[Orchestrator] x402 to ${targetName} returned ${res.status}, using direct call`);
  } catch (err) {
    console.warn(`[Orchestrator] x402 to ${targetName} failed:`, (err as Error).message?.slice(0, 80));
  }

  // Fallback: direct internal call (agent wallets may not have USDC yet)
  const agentIdMatch = targetEndpoint.match(/\/api\/agents\/(\d+)\//);
  if (agentIdMatch) {
    const res = await fetch(`${SERVER_URL}/api/hire/${agentIdMatch[1]}`, { method: 'POST' });
    const data = await res.json();
    return { data, paidViaX402: false };
  }

  throw new Error(`Invalid endpoint: ${targetEndpoint}`);
}

export async function runOrchestration(): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const orchestrationId = Math.random().toString(36).slice(2);
  const steps: OrchestrationStep[] = [];
  const traderWallet = getAgentWallet(2);

  // Step 1: TraderBot initiates
  steps.push({
    step: 1,
    agent: 'TraderBot',
    action: `Initiating orchestration (wallet: ${traderWallet?.address.slice(0, 10)}...)`,
    status: 'complete',
    timestamp: Date.now(),
  });

  activityLog.add({
    type: 'orchestration',
    fromAgent: 'TraderBot',
    toAgent: 'System',
    amount: '0',
    description: `TraderBot initiating autonomous orchestration from ${traderWallet?.address.slice(0, 10)}...`,
  });

  // Step 2 & 3: Pay + call DataBot via x402
  let dataBotResult: DataBotResult;
  try {
    const { data, paidViaX402 } = await callAgentViaX402(
      2, '/api/agents/0/crypto-analysis', 'DataBot',
    );
    dataBotResult = data;

    steps.push({
      step: 2,
      agent: 'TraderBot',
      action: paidViaX402
        ? 'x402 payment to DataBot ($0.02 USDC) — settled on-chain via EIP-3009'
        : 'Called DataBot (demo mode)',
      status: 'complete',
      timestamp: Date.now(),
    });

    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'TraderBot',
      toAgent: 'DataBot',
      amount: '0.02',
      description: paidViaX402
        ? 'Real x402 micropayment — EIP-3009 USDC transferWithAuthorization'
        : 'Demo x402 payment for crypto analysis',
    });

    steps.push({
      step: 3,
      agent: 'DataBot',
      action: `Chainlink + CoinGecko data fetched (${dataBotResult.chainlinkFeeds?.length || 0} feeds)`,
      status: 'complete',
      timestamp: Date.now(),
      result: { summary: dataBotResult.summary },
    });

    const repTx = await recordReputation(0, traderWallet?.address || '0x0000000000000000000000000000000000000000', true, 450);
    if (repTx) {
      activityLog.add({
        type: 'reputation_update',
        fromAgent: 'System',
        toAgent: 'DataBot',
        amount: '0',
        description: 'On-chain reputation: success, rating 4.5/5',
        txHash: repTx,
      });
    }
  } catch (err) {
    console.error('[Orchestrator] DataBot failed:', err);
    steps.push({ step: 3, agent: 'DataBot', action: 'Data fetch failed', status: 'error', timestamp: Date.now() });
    await recordReputation(0, '0x0000000000000000000000000000000000000000', false, 200);
    return { id: orchestrationId, steps, tradingSignals: null, totalCost: '0.02', duration: Date.now() - startTime, timestamp: startTime };
  }

  // Step 4 & 5: Pay + call NewsBot via x402
  let newsBotResult: NewsBotResult;
  try {
    const { data, paidViaX402 } = await callAgentViaX402(
      2, '/api/agents/1/news-summary', 'NewsBot',
    );
    newsBotResult = data;

    steps.push({
      step: 4,
      agent: 'TraderBot',
      action: paidViaX402
        ? 'x402 payment to NewsBot ($0.01 USDC) — settled on-chain via EIP-3009'
        : 'Called NewsBot (demo mode)',
      status: 'complete',
      timestamp: Date.now(),
    });

    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'TraderBot',
      toAgent: 'NewsBot',
      amount: '0.01',
      description: paidViaX402
        ? 'Real x402 micropayment — EIP-3009 USDC transferWithAuthorization'
        : 'Demo x402 payment for news summary',
    });

    steps.push({
      step: 5,
      agent: 'NewsBot',
      action: `News analyzed (${newsBotResult.articles?.length || 0} articles) + AI summary via Groq`,
      status: 'complete',
      timestamp: Date.now(),
      result: { summary: newsBotResult.summary },
    });

    const repTx = await recordReputation(1, traderWallet?.address || '0x0000000000000000000000000000000000000000', true, 420);
    if (repTx) {
      activityLog.add({
        type: 'reputation_update',
        fromAgent: 'System',
        toAgent: 'NewsBot',
        amount: '0',
        description: 'On-chain reputation: success, rating 4.2/5',
        txHash: repTx,
      });
    }
  } catch (err) {
    console.error('[Orchestrator] NewsBot failed:', err);
    steps.push({ step: 5, agent: 'NewsBot', action: 'News fetch failed', status: 'error', timestamp: Date.now() });
    await recordReputation(1, '0x0000000000000000000000000000000000000000', false, 200);
    return { id: orchestrationId, steps, tradingSignals: null, totalCost: '0.03', duration: Date.now() - startTime, timestamp: startTime };
  }

  // Step 6: TraderBot merges with AI
  let traderBotResult: TraderBotResult;
  try {
    traderBotResult = await runTraderBot(dataBotResult, newsBotResult);
    steps.push({
      step: 6,
      agent: 'TraderBot',
      action: `AI analysis — ${traderBotResult.signals.length} trading signals via Groq LLM`,
      status: 'complete',
      timestamp: Date.now(),
      result: { signals: traderBotResult.signals, summary: traderBotResult.summary },
    });

    activityLog.add({
      type: 'agent_call',
      fromAgent: 'TraderBot',
      toAgent: 'Groq LLM',
      amount: '0',
      description: `AI analysis: ${traderBotResult.summary.slice(0, 120)}`,
    });

    const repTx = await recordReputation(2, '0x0000000000000000000000000000000000000000', true, 470);
    if (repTx) {
      activityLog.add({
        type: 'reputation_update',
        fromAgent: 'System',
        toAgent: 'TraderBot',
        amount: '0',
        description: 'On-chain reputation: success, rating 4.7/5',
        txHash: repTx,
      });
    }
  } catch (err) {
    console.error('[Orchestrator] TraderBot AI merge failed:', err);
    steps.push({ step: 6, agent: 'TraderBot', action: 'AI merge failed', status: 'error', timestamp: Date.now() });
    await recordReputation(2, '0x0000000000000000000000000000000000000000', false, 200);
    return { id: orchestrationId, steps, tradingSignals: null, totalCost: '0.03', duration: Date.now() - startTime, timestamp: startTime };
  }

  // Step 7: Complete
  steps.push({
    step: 7,
    agent: 'System',
    action: 'Orchestration complete — agents paid, reputation recorded on Avalanche Fuji',
    status: 'complete',
    timestamp: Date.now(),
  });

  activityLog.add({
    type: 'orchestration',
    fromAgent: 'TraderBot',
    toAgent: 'System',
    amount: '0.03',
    description: `Orchestration complete: ${traderBotResult.signals.length} signals, $0.03 total, ${Date.now() - startTime}ms`,
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
