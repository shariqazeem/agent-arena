import Groq from 'groq-sdk';
import type { DataBotResult } from './dataBot.js';
import type { NewsBotResult } from './newsBot.js';

export interface TradingSignal {
  asset: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
}

export interface TraderBotResult {
  agent: string;
  agentId: number;
  timestamp: number;
  dataSources: {
    dataBot: DataBotResult;
    newsBot: NewsBotResult;
  };
  signals: TradingSignal[];
  summary: string;
}

export async function runTraderBot(
  dataBotResult: DataBotResult,
  newsBotResult: NewsBotResult
): Promise<TraderBotResult> {
  const apiKey = process.env.GROQ_API_KEY;

  let signals: TradingSignal[];
  let summary: string;

  if (!apiKey) {
    signals = [
      { asset: 'AVAX', action: 'BUY', confidence: 72, reasoning: 'Positive ecosystem growth and DeFi activity increase' },
      { asset: 'BTC', action: 'HOLD', confidence: 65, reasoning: 'ETF inflows strong but price at resistance levels' },
      { asset: 'ETH', action: 'HOLD', confidence: 58, reasoning: 'Mixed signals — awaiting catalyst for breakout' },
    ];
    summary = 'TraderBot recommends accumulating AVAX on ecosystem strength. BTC and ETH in wait-and-see territory.';
  } else {
    try {
      const groq = new Groq({ apiKey });

      const marketContext = `Market Data:\n${dataBotResult.summary}\n\nNews Summary:\n${newsBotResult.summary}`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a crypto trading signal generator. Based on the provided market data and news, generate trading signals for AVAX, BTC, and ETH. Return ONLY valid JSON: {"signals":[{"asset":"AVAX","action":"BUY|SELL|HOLD","confidence":0-100,"reasoning":"..."}],"summary":"2-3 sentence overview"}`,
          },
          { role: 'user', content: marketContext },
        ],
        max_tokens: 500,
        temperature: 0.4,
      });

      const text = completion.choices[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { signals: TradingSignal[]; summary: string };
        signals = parsed.signals;
        summary = parsed.summary;
      } else {
        throw new Error('No JSON in response');
      }
    } catch (err) {
      console.error('TraderBot Groq error:', err);
      signals = [
        { asset: 'AVAX', action: 'HOLD', confidence: 50, reasoning: 'Insufficient data for strong signal' },
        { asset: 'BTC', action: 'HOLD', confidence: 50, reasoning: 'Insufficient data for strong signal' },
        { asset: 'ETH', action: 'HOLD', confidence: 50, reasoning: 'Insufficient data for strong signal' },
      ];
      summary = 'TraderBot defaulting to HOLD across assets due to analysis uncertainty.';
    }
  }

  return {
    agent: 'TraderBot',
    agentId: 2,
    timestamp: Date.now(),
    dataSources: { dataBot: dataBotResult, newsBot: newsBotResult },
    signals,
    summary,
  };
}
