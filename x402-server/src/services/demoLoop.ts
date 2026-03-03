import { runOrchestration } from './orchestrator.js';
import { runDataBot } from '../agents/dataBot.js';
import { runNewsBot } from '../agents/newsBot.js';
import { runSentimentBot } from '../agents/sentimentBot.js';
import { activityLog } from './activityLog.js';
import { getAgentWallet } from './agentWallets.js';

let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;
let cycleCount = 0;

export function startDemoLoop(intervalMs = 45_000) {
  if (intervalId) return;

  console.log(`[DemoLoop] Started — cycling every ${intervalMs / 1000}s`);

  // Run first orchestration after a short delay to let server settle
  setTimeout(() => runCycle(), 3_000);

  intervalId = setInterval(runCycle, intervalMs);
}

export function stopDemoLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[DemoLoop] Stopped');
  }
}

async function runCycle() {
  if (running) return;
  running = true;
  cycleCount++;

  try {
    // Alternate between full orchestration and individual agent showcases
    if (cycleCount % 3 === 1) {
      // Full orchestration — the main show
      console.log(`[DemoLoop] Cycle ${cycleCount}: Full orchestration`);
      const result = await runOrchestration();
      console.log(
        `[DemoLoop] Orchestration: ${result.tradingSignals?.signals.length ?? 0} signals, ` +
        `$${result.totalCost} USDC, ${result.duration}ms`
      );
    } else if (cycleCount % 3 === 2) {
      // Individual agent showcase — DataBot + SentimentBot
      console.log(`[DemoLoop] Cycle ${cycleCount}: DataBot + SentimentBot showcase`);

      const dataBotWallet = getAgentWallet(0);
      activityLog.add({
        type: 'agent_call',
        fromAgent: 'System',
        toAgent: 'DataBot',
        amount: '0',
        description: `DataBot self-check from ${dataBotWallet?.address.slice(0, 10)}...`,
      });

      const dataResult = await runDataBot();
      activityLog.add({
        type: 'agent_call',
        fromAgent: 'DataBot',
        toAgent: 'System',
        amount: '0',
        description: `Fetched ${dataResult.chainlinkFeeds.length} Chainlink feeds + ${dataResult.marketData.length} market pairs`,
      });

      const sentimentResult = await runSentimentBot();
      activityLog.add({
        type: 'agent_call',
        fromAgent: 'SentimentBot',
        toAgent: 'System',
        amount: '0',
        description: `Sentiment: ${sentimentResult.sentiment.overall} (F&G: ${sentimentResult.sentiment.fearGreedIndex}) — ${sentimentResult.trending.length} trending coins`,
      });
    } else {
      // NewsBot showcase
      console.log(`[DemoLoop] Cycle ${cycleCount}: NewsBot showcase`);

      const newsBotWallet = getAgentWallet(1);
      activityLog.add({
        type: 'agent_call',
        fromAgent: 'System',
        toAgent: 'NewsBot',
        amount: '0',
        description: `NewsBot scan initiated from ${newsBotWallet?.address.slice(0, 10)}...`,
      });

      const newsResult = await runNewsBot();
      activityLog.add({
        type: 'agent_call',
        fromAgent: 'NewsBot',
        toAgent: 'System',
        amount: '0',
        description: `Analyzed ${newsResult.articleCount} articles via Groq AI: ${newsResult.summary.slice(0, 100)}...`,
      });
    }
  } catch (err) {
    console.error(`[DemoLoop] Cycle ${cycleCount} error:`, err);
  } finally {
    running = false;
  }
}
