import { runOrchestration } from './orchestrator.js';

let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

export function startDemoLoop(intervalMs = 60_000) {
  if (intervalId) return;

  console.log(`Demo loop started — orchestrating every ${intervalMs / 1000}s`);

  // Run immediately
  runOnce();

  intervalId = setInterval(runOnce, intervalMs);
}

export function stopDemoLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('Demo loop stopped');
  }
}

async function runOnce() {
  if (running) return;
  running = true;

  try {
    console.log('[DemoLoop] Running orchestration...');
    const result = await runOrchestration();
    console.log(
      `[DemoLoop] Orchestration complete: ${result.steps.length} steps, ` +
      `${result.tradingSignals?.signals.length ?? 0} signals, ${result.duration}ms`
    );
  } catch (err) {
    console.error('[DemoLoop] Orchestration error:', err);
  } finally {
    running = false;
  }
}
