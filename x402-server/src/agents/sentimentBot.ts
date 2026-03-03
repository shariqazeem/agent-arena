import Groq from 'groq-sdk';

interface SentimentData {
  overall: 'Bullish' | 'Bearish' | 'Neutral';
  score: number; // -100 to 100
  fearGreedIndex: number; // 0 to 100
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topSignals: string[];
}

interface TrendingCoin {
  name: string;
  symbol: string;
  marketCapRank: number;
  priceChange24h: number;
}

export interface SentimentBotResult {
  agent: string;
  agentId: number;
  timestamp: number;
  sentiment: SentimentData;
  trending: TrendingCoin[];
  summary: string;
}

async function fetchNewsHeadlines(): Promise<string[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=crypto+market+sentiment+bitcoin&sortBy=publishedAt&pageSize=10&language=en&apiKey=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
      const data = await res.json() as { articles: Array<{ title: string }> };
      return data.articles.filter((a) => a.title && a.title !== '[Removed]').map((a) => a.title);
    } catch (err) {
      console.warn('NewsAPI for sentiment failed:', (err as Error).message);
    }
  }
  return [];
}

async function fetchTrending(): Promise<TrendingCoin[]> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json() as {
      coins: Array<{
        item: { name: string; symbol: string; market_cap_rank: number; data?: { price_change_percentage_24h?: Record<string, number> } }
      }>
    };
    return data.coins.slice(0, 6).map((c) => ({
      name: c.item.name,
      symbol: c.item.symbol,
      marketCapRank: c.item.market_cap_rank,
      priceChange24h: c.item.data?.price_change_percentage_24h?.usd ?? 0,
    }));
  } catch {
    return [];
  }
}

async function fetchFearGreedIndex(): Promise<{ value: number; classification: string } | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { data: Array<{ value: string; value_classification: string }> };
    return {
      value: parseInt(data.data[0].value, 10),
      classification: data.data[0].value_classification,
    };
  } catch {
    return null;
  }
}

export async function runSentimentBot(): Promise<SentimentBotResult> {
  // Fetch all data sources in parallel
  const [headlines, trending, fearGreed] = await Promise.all([
    fetchNewsHeadlines(),
    fetchTrending(),
    fetchFearGreedIndex(),
  ]);

  const apiKey = process.env.GROQ_API_KEY;
  let sentiment: SentimentData;
  let summary: string;

  if (!apiKey) {
    // Rule-based fallback using real data
    const fgi = fearGreed?.value ?? 50;
    const trendingUp = trending.filter((t) => t.priceChange24h > 0).length;
    const trendingDown = trending.length - trendingUp;
    const overall: 'Bullish' | 'Bearish' | 'Neutral' = fgi > 60 ? 'Bullish' : fgi < 40 ? 'Bearish' : 'Neutral';

    sentiment = {
      overall,
      score: fgi - 50,
      fearGreedIndex: fgi,
      breakdown: {
        positive: Math.round((trendingUp / Math.max(trending.length, 1)) * 100),
        negative: Math.round((trendingDown / Math.max(trending.length, 1)) * 100),
        neutral: trending.length === 0 ? 100 : 0,
      },
      topSignals: [
        fearGreed ? `Fear & Greed Index: ${fearGreed.value} (${fearGreed.classification})` : 'Fear & Greed data unavailable',
        `${trending.length} trending coins on CoinGecko`,
        `${trendingUp}/${trending.length} trending coins up in 24h`,
      ],
    };
    summary = `Market sentiment is ${overall.toLowerCase()}. Fear & Greed Index at ${fgi}${fearGreed ? ` (${fearGreed.classification})` : ''}. ${trendingUp} of ${trending.length} trending coins showing positive momentum.`;
  } else {
    try {
      const groq = new Groq({ apiKey });

      const trendingText = trending.length > 0
        ? trending.map((t) => `${t.name} (${t.symbol}): rank #${t.marketCapRank}, 24h: ${t.priceChange24h > 0 ? '+' : ''}${t.priceChange24h.toFixed(1)}%`).join('\n')
        : 'No trending data available';

      const headlinesText = headlines.length > 0
        ? headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
        : 'No headlines available';

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are SentimentBot, the market psychology analyst in the Agent Arena marketplace on Avalanche. You analyze:
- Fear & Greed Index (real-time from alternative.me)
- CoinGecko trending coins (social/search volume signals)
- Crypto news sentiment (headlines analysis)

Your output drives TraderBot's risk management. Be precise, data-driven, and flag contrarian signals (e.g., extreme greed = potential top, extreme fear = potential bottom).

Return ONLY valid JSON:
{
  "overall": "Bullish|Bearish|Neutral",
  "score": -100 to 100,
  "fearGreedIndex": 0-100,
  "breakdown": {"positive": 0-100, "negative": 0-100, "neutral": 0-100},
  "topSignals": ["signal1", "signal2", "signal3"],
  "summary": "3-4 sentences with actionable sentiment intelligence"
}`,
          },
          {
            role: 'user',
            content: `=== REAL-TIME SENTIMENT DATA ===

Fear & Greed Index: ${fearGreed ? `${fearGreed.value} (${fearGreed.classification})` : 'Unavailable'}

CoinGecko Trending Coins:
${trendingText}

News Headlines (${headlines.length} articles):
${headlinesText}

=== Analyze market sentiment ===`,
          },
        ],
        max_tokens: 400,
        temperature: 0.3,
      });

      const text = completion.choices[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as SentimentData & { summary: string };
        summary = parsed.summary;
        sentiment = {
          overall: parsed.overall,
          score: Math.min(100, Math.max(-100, parsed.score)),
          fearGreedIndex: fearGreed?.value ?? parsed.fearGreedIndex,
          breakdown: parsed.breakdown,
          topSignals: parsed.topSignals,
        };
      } else {
        throw new Error('No JSON in response');
      }
    } catch (err) {
      console.error('SentimentBot Groq error:', err);
      const fgi = fearGreed?.value ?? 50;
      sentiment = {
        overall: 'Neutral',
        score: 0,
        fearGreedIndex: fgi,
        breakdown: { positive: 33, negative: 33, neutral: 34 },
        topSignals: [
          fearGreed ? `Fear & Greed: ${fearGreed.value} (${fearGreed.classification})` : 'Sentiment data limited',
          `${trending.length} coins trending on CoinGecko`,
        ],
      };
      summary = `AI analysis error — rule-based fallback. Fear & Greed at ${fgi}. ${trending.length} coins trending.`;
    }
  }

  return {
    agent: 'SentimentBot',
    agentId: 3,
    timestamp: Date.now(),
    sentiment,
    trending,
    summary,
  };
}
