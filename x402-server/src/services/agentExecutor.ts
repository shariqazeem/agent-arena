import { runDataBot } from '../agents/dataBot.js';
import { runNewsBot } from '../agents/newsBot.js';
import { runTraderBot } from '../agents/traderBot.js';
import { runSentimentBot } from '../agents/sentimentBot.js';
import { getOnChainAgent } from './agentRegistry.js';
import { activityLog } from './activityLog.js';
import { recordReputation } from './reputation.js';

export interface ExecutionResult {
  agentId: number;
  agentName: string;
  result: unknown;
  executionTime: number;
  source: 'builtin' | 'external';
}

// Built-in agent runners (agents 0-3)
const BUILTIN_RUNNERS: Record<number, { name: string; run: () => Promise<unknown>; price: string }> = {
  0: { name: 'DataBot', run: () => runDataBot(), price: '0.02' },
  1: { name: 'NewsBot', run: () => runNewsBot(), price: '0.01' },
  2: {
    name: 'TraderBot',
    run: async () => {
      const data = await runDataBot();
      const news = await runNewsBot();
      return runTraderBot(data, news);
    },
    price: '0.05',
  },
  3: { name: 'SentimentBot', run: () => runSentimentBot(), price: '0.03' },
};

/**
 * Unified agent execution — works for built-in agents (0-3) and user-deployed agents.
 */
export async function executeAgent(agentId: number, body?: unknown): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Built-in agents: direct execution
  const builtin = BUILTIN_RUNNERS[agentId];
  if (builtin) {
    const result = await builtin.run();

    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'Client',
      toAgent: builtin.name,
      amount: builtin.price,
      description: `Hired ${builtin.name} via Agent Arena`,
    });

    // Record reputation (non-blocking)
    recordReputation(agentId, '0x0000000000000000000000000000000000000000', true, 450).catch(() => {});

    return {
      agentId,
      agentName: builtin.name,
      result,
      executionTime: Date.now() - startTime,
      source: 'builtin',
    };
  }

  // User-deployed agents: proxy to their on-chain endpoint
  const agent = await getOnChainAgent(agentId);
  if (!agent || !agent.isActive) {
    throw new Error(`Agent ${agentId} not found or inactive`);
  }

  // Validate endpoint
  const endpoint = agent.endpoint;
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    throw new Error(`Agent ${agentId} has invalid endpoint`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    // Try GET first (most public APIs), fall back to POST if body provided
    const method = body ? 'POST' : 'GET';
    const fetchOptions: RequestInit = {
      method,
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    };
    if (body) {
      fetchOptions.headers = { ...fetchOptions.headers, 'Content-Type': 'application/json' };
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(endpoint, fetchOptions);

    if (!res.ok) {
      throw new Error(`Agent ${agent.name} returned ${res.status}`);
    }

    // Content-type aware parsing
    const contentType = res.headers.get('content-type') || '';
    let rawResult: unknown;
    if (contentType.includes('application/json')) {
      rawResult = await res.json();
    } else {
      const text = await res.text();
      try {
        rawResult = JSON.parse(text);
      } catch {
        rawResult = text;
      }
    }

    // String payloads skip envelope unwrapping
    let payload: unknown = rawResult;
    if (typeof payload !== 'string') {
      // Unwrap common API envelope patterns: { data: [...] }, { results: [...] }, { items: [...] }
      if (!Array.isArray(payload) && typeof payload === 'object' && payload !== null) {
        const obj = payload as Record<string, unknown>;
        for (const key of ['data', 'results', 'items', 'records', 'pools', 'entries']) {
          if (Array.isArray(obj[key])) {
            payload = obj[key];
            break;
          }
        }
      }
    }

    // Determine data shape and prepare display data — preserve original order
    let displayData: unknown;
    let _dataShape: 'array-of-objects' | 'array-of-primitives' | 'object' | 'string';
    const isArr = Array.isArray(payload);
    const totalCount = isArr ? (payload as unknown[]).length : undefined;

    if (typeof payload === 'string') {
      _dataShape = 'string';
      displayData = payload;
    } else if (isArr) {
      const arr = payload as unknown[];
      const firstItem = arr[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        _dataShape = 'array-of-objects';
      } else {
        _dataShape = 'array-of-primitives';
      }
      displayData = arr.slice(0, 25);
    } else {
      _dataShape = 'object';
      displayData = payload;
    }

    const asObj = (!isArr && typeof payload === 'object' && payload !== null ? payload : {}) as Record<string, unknown>;
    let summary: string;
    if (typeof payload === 'string') {
      summary = `${agent.name} returned a text response`;
    } else if (isArr) {
      summary = `${agent.name} returned ${totalCount} records`;
    } else {
      summary = `${agent.name} returned data with keys: ${Object.keys(asObj).slice(0, 5).join(', ')}`;
    }

    const result = {
      _external: true,
      _agentName: agent.name,
      _endpoint: endpoint,
      _dataShape,
      _dataKeys: isArr ? [`Array[${totalCount}]`] : Object.keys(asObj).slice(0, 10),
      _recordCount: totalCount,
      data: displayData,
      summary,
    };

    const recordDesc = isArr ? `${totalCount} records` : 'data received';
    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'Client',
      toAgent: agent.name,
      amount: agent.pricePerQuery,
      description: `Hired ${agent.name} — ${recordDesc} from external endpoint`,
    });

    // Record reputation (non-blocking)
    recordReputation(agentId, '0x0000000000000000000000000000000000000000', true, 400).catch(() => {});

    return {
      agentId,
      agentName: agent.name,
      result,
      executionTime: Date.now() - startTime,
      source: 'external',
    };
  } catch (err) {
    // Record failure reputation
    recordReputation(agentId, '0x0000000000000000000000000000000000000000', false, 200).catch(() => {});

    if ((err as Error).name === 'AbortError') {
      throw new Error(`Agent ${agent.name} timed out (15s)`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
