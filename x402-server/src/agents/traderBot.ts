import Groq from 'groq-sdk';
import type { DataBotResult } from './dataBot.js';
import type { NewsBotResult } from './newsBot.js';

export interface TradingSignal {
  asset: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
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
  riskDisclaimer: string;
}

export async function runTraderBot(
  dataBotResult: DataBotResult,
  newsBotResult: NewsBotResult
): Promise<TraderBotResult> {
  const apiKey = process.env.GROQ_API_KEY;
  const riskDisclaimer = 'AI-generated signals for educational purposes only. Not financial advice. Always DYOR.';

  let signals: TradingSignal[];
  let summary: string;

  if (!apiKey) {
    signals = buildFallbackSignals(dataBotResult);
    summary = 'AI analysis unavailable — showing rule-based signals from on-chain data.';
  } else {
    try {
      const groq = new Groq({ apiKey });

      // Build rich context from both data sources
      const chainlinkPrices = dataBotResult.chainlinkFeeds
        .map((f) => `${f.pair}: $${f.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} (Chainlink oracle)`)
        .join('\n');

      const marketMetrics = dataBotResult.marketData
        .map((m) => `${m.symbol}: $${m.price.toLocaleString()} | 24h: ${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(2)}% | 7d: ${m.change7d > 0 ? '+' : ''}${m.change7d.toFixed(2)}% | Vol: $${(m.volume24h / 1e9).toFixed(2)}B`)
        .join('\n');

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are TraderBot, the lead AI trading strategist in the Agent Arena marketplace on Avalanche. You orchestrate other agents (DataBot, NewsBot) and synthesize their data into actionable trading signals.

Your process:
1. DataBot provided Chainlink oracle prices + CoinGecko market data (paid via x402 USDC)
2. NewsBot provided AI-analyzed news intelligence (paid via x402 USDC)
3. You now synthesize both into trading signals

Rules:
- Generate signals for AVAX, BTC, ETH (minimum), plus LINK if data available
- Each signal needs: asset, action (BUY/SELL/HOLD), confidence (0-100), reasoning (1 sentence), riskLevel (LOW/MEDIUM/HIGH), timeframe (e.g. "24h", "1-3 days", "1 week")
- Confidence > 70 = strong signal, 50-70 = moderate, < 50 = weak
- Consider: price momentum (24h/7d changes), volume trends, news catalysts, on-chain vs off-chain price divergence
- Be contrarian when warranted — high confidence consensus often signals reversals

Return ONLY valid JSON:
{"signals":[{"asset":"AVAX","action":"BUY","confidence":75,"reasoning":"...","riskLevel":"MEDIUM","timeframe":"24h"}],"summary":"2-3 sentence market overview with key thesis"}`,
          },
          {
            role: 'user',
            content: `=== DATABOT INTELLIGENCE (x402 paid: $0.02 USDC) ===
Chainlink Oracle Prices:
${chainlinkPrices || 'No oracle data'}

Market Metrics:
${marketMetrics || 'No market data'}

DataBot Analysis: ${dataBotResult.summary}

=== NEWSBOT INTELLIGENCE (x402 paid: $0.01 USDC) ===
${newsBotResult.summary}

Headlines analyzed: ${newsBotResult.articles?.length || 0}

=== Generate trading signals ===`,
          },
        ],
        max_tokens: 600,
        temperature: 0.4,
      });

      const text = completion.choices[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { signals: TradingSignal[]; summary: string };
        signals = parsed.signals.map((s) => ({
          asset: s.asset,
          action: s.action,
          confidence: Math.min(100, Math.max(0, s.confidence)),
          reasoning: s.reasoning,
          riskLevel: s.riskLevel || 'MEDIUM',
          timeframe: s.timeframe || '24h',
        }));
        summary = parsed.summary;
      } else {
        throw new Error('No JSON in LLM response');
      }
    } catch (err) {
      console.error('TraderBot AI error:', err);
      signals = buildFallbackSignals(dataBotResult);
      summary = 'AI analysis encountered an error — showing rule-based signals from on-chain data.';
    }
  }

  return {
    agent: 'TraderBot',
    agentId: 2,
    timestamp: Date.now(),
    dataSources: { dataBot: dataBotResult, newsBot: newsBotResult },
    signals,
    summary,
    riskDisclaimer,
  };
}

function buildFallbackSignals(data: DataBotResult): TradingSignal[] {
  const signals: TradingSignal[] = [];
  for (const m of data.marketData) {
    const action: 'BUY' | 'SELL' | 'HOLD' =
      m.change24h > 3 ? 'BUY' : m.change24h < -3 ? 'SELL' : 'HOLD';
    signals.push({
      asset: m.symbol,
      action,
      confidence: Math.min(70, Math.abs(m.change24h) * 10 + 30),
      reasoning: `${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(1)}% in 24h — ${action === 'BUY' ? 'momentum buy' : action === 'SELL' ? 'momentum sell' : 'range-bound'}`,
      riskLevel: Math.abs(m.change24h) > 5 ? 'HIGH' : 'MEDIUM',
      timeframe: '24h',
    });
  }
  return signals.length > 0 ? signals : [
    { asset: 'AVAX', action: 'HOLD', confidence: 50, reasoning: 'Insufficient data', riskLevel: 'LOW', timeframe: '24h' },
  ];
}
