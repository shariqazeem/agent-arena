import { Router } from 'express';
import Groq from 'groq-sdk';
import { runDataBot } from '../agents/dataBot.js';
import { runNewsBot } from '../agents/newsBot.js';
import { runTraderBot } from '../agents/traderBot.js';
import { runSentimentBot } from '../agents/sentimentBot.js';
import { activityLog } from '../services/activityLog.js';

export const queryRouter = Router();

interface QueryResult {
  query: string;
  agentsUsed: string[];
  response: string;
  data: Record<string, unknown>;
  totalCost: string;
  duration: number;
}

// Classify which agents should handle a natural language query
function classifyQuery(query: string): string[] {
  const q = query.toLowerCase();
  const agents: string[] = [];

  // Price/data queries → DataBot
  if (q.match(/price|value|worth|cost|market cap|volume|chainlink|oracle|data|chart/)) {
    agents.push('DataBot');
  }

  // News queries → NewsBot
  if (q.match(/news|headline|article|recent|latest|happening|event|update/)) {
    agents.push('NewsBot');
  }

  // Trading queries → TraderBot (which orchestrates DataBot + NewsBot)
  if (q.match(/trade|buy|sell|hold|signal|invest|position|portfolio|recommend/)) {
    agents.push('TraderBot');
  }

  // Sentiment queries → SentimentBot
  if (q.match(/sentiment|mood|fear|greed|feeling|trend|bullish|bearish|opinion/)) {
    agents.push('SentimentBot');
  }

  // Default: use TraderBot (most comprehensive — orchestrates others)
  if (agents.length === 0) {
    agents.push('TraderBot');
  }

  return agents;
}

async function synthesizeResponse(
  query: string,
  agentResults: Record<string, unknown>,
  agentsUsed: string[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return `Queried ${agentsUsed.join(', ')}. Results available in the data field.`;
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are the Agent Arena query router. You've dispatched the user's question to ${agentsUsed.join(', ')} and received their results. Synthesize a clear, concise answer (3-5 sentences) that directly addresses the user's question. Reference specific data points from the agents. Be direct and helpful.`,
        },
        {
          role: 'user',
          content: `Question: "${query}"\n\nAgent results:\n${JSON.stringify(agentResults, null, 2).slice(0, 3000)}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content || `Results from ${agentsUsed.join(', ')} are ready.`;
  } catch {
    return `Queried ${agentsUsed.join(', ')} successfully. See data for details.`;
  }
}

queryRouter.post('/query', async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  const startTime = Date.now();
  const agentsUsed = classifyQuery(query);
  const agentResults: Record<string, unknown> = {};
  let totalCost = 0;

  activityLog.add({
    type: 'agent_call',
    fromAgent: 'User',
    toAgent: 'Router',
    amount: '0',
    description: `Query: "${query.slice(0, 80)}" → routing to ${agentsUsed.join(', ')}`,
  });

  try {
    // Run selected agents in parallel where possible
    const tasks: Array<Promise<void>> = [];

    if (agentsUsed.includes('TraderBot')) {
      // TraderBot already orchestrates DataBot + NewsBot
      tasks.push(
        (async () => {
          const dataResult = await runDataBot();
          const newsResult = await runNewsBot();
          const traderResult = await runTraderBot(dataResult, newsResult);
          agentResults.traderBot = traderResult;
          totalCost += 0.05;
        })()
      );
    } else {
      if (agentsUsed.includes('DataBot')) {
        tasks.push(
          (async () => {
            agentResults.dataBot = await runDataBot();
            totalCost += 0.02;
          })()
        );
      }
      if (agentsUsed.includes('NewsBot')) {
        tasks.push(
          (async () => {
            agentResults.newsBot = await runNewsBot();
            totalCost += 0.01;
          })()
        );
      }
    }

    if (agentsUsed.includes('SentimentBot')) {
      tasks.push(
        (async () => {
          agentResults.sentimentBot = await runSentimentBot();
          totalCost += 0.03;
        })()
      );
    }

    await Promise.all(tasks);

    const response = await synthesizeResponse(query, agentResults, agentsUsed);
    const duration = Date.now() - startTime;

    activityLog.add({
      type: 'agent_call',
      fromAgent: 'Router',
      toAgent: 'User',
      amount: totalCost.toFixed(2),
      description: `Query answered in ${duration}ms via ${agentsUsed.join(' + ')}`,
    });

    const result: QueryResult = {
      query,
      agentsUsed,
      response,
      data: agentResults,
      totalCost: totalCost.toFixed(2),
      duration,
    };

    res.json(result);
  } catch (err) {
    console.error('Query routing error:', err);
    res.status(500).json({ error: 'Query failed' });
  }
});
