import Groq from 'groq-sdk';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description?: string;
}

async function fetchCryptoNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY;

  // Try NewsAPI first
  if (apiKey) {
    try {
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=(avalanche OR bitcoin OR ethereum OR "AI agents" OR "crypto") AND NOT spam&sortBy=publishedAt&pageSize=10&language=en&apiKey=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
      const data = await res.json() as { articles: Array<{ title: string; source: { name: string }; url: string; publishedAt: string; description: string | null }> };
      return data.articles
        .filter((a) => a.title && a.title !== '[Removed]')
        .map((a) => ({
          title: a.title,
          source: a.source.name,
          url: a.url,
          publishedAt: a.publishedAt,
          description: a.description || undefined,
        }));
    } catch (err) {
      console.warn('NewsAPI failed:', (err as Error).message);
    }
  }

  // Fallback: fetch from CoinGecko trending/status
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json() as { coins: Array<{ item: { name: string; symbol: string; score: number } }> };
      return data.coins.slice(0, 5).map((c) => ({
        title: `${c.item.name} (${c.item.symbol}) trending — rank #${c.item.score + 1} on CoinGecko`,
        source: 'CoinGecko Trending',
        url: `https://coingecko.com/en/coins/${c.item.name.toLowerCase()}`,
        publishedAt: new Date().toISOString(),
      }));
    }
  } catch {
    // ignore
  }

  return [
    { title: 'Live news unavailable — using cached market context', source: 'System', url: '#', publishedAt: new Date().toISOString() },
  ];
}

async function analyzeWithGroq(articles: NewsArticle[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return `Analyzed ${articles.length} headlines. ` + articles.slice(0, 3).map((a) => a.title).join('. ');
  }

  try {
    const groq = new Groq({ apiKey });
    const articlesText = articles.map((a, i) =>
      `${i + 1}. "${a.title}" — ${a.source} (${new Date(a.publishedAt).toLocaleDateString()})${a.description ? `\n   ${a.description.slice(0, 150)}` : ''}`
    ).join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are NewsBot, an AI crypto news intelligence agent in the Agent Arena marketplace on Avalanche. Your job is to:
- Distill ${articles.length} news articles into actionable market intelligence
- Identify the dominant narrative (bullish/bearish catalysts)
- Flag any regulatory, technical, or macro events that could move markets
- Rate overall news sentiment as Bullish/Bearish/Neutral with a 1-sentence justification
- Your analysis is consumed by TraderBot and SentimentBot via x402 micropayments

Format: Start with sentiment rating, then 2-3 key insights, end with "Key risk:" one-liner. Be concise and direct — every word costs money.`,
        },
        {
          role: 'user',
          content: `Analyze these crypto news articles for market impact:\n\n${articlesText}`,
        },
      ],
      max_tokens: 350,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || articles.map((a) => a.title).join('. ');
  } catch (err) {
    console.error('NewsBot Groq error:', err);
    return articles.map((a) => a.title).join('. ');
  }
}

export interface NewsBotResult {
  agent: string;
  agentId: number;
  timestamp: number;
  articles: NewsArticle[];
  summary: string;
  articleCount: number;
}

export async function runNewsBot(): Promise<NewsBotResult> {
  const articles = await fetchCryptoNews();
  const summary = await analyzeWithGroq(articles);

  return {
    agent: 'NewsBot',
    agentId: 1,
    timestamp: Date.now(),
    articles,
    summary,
    articleCount: articles.length,
  };
}
