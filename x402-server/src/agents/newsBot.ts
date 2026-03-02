import Groq from 'groq-sdk';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

async function fetchNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    return [
      { title: 'Avalanche Ecosystem Sees Surge in DeFi Activity', source: 'CoinDesk', url: 'https://coindesk.com', publishedAt: new Date().toISOString() },
      { title: 'Bitcoin ETF Inflows Hit Record High', source: 'The Block', url: 'https://theblock.co', publishedAt: new Date().toISOString() },
      { title: 'Chainlink CCIP Expands to New Chains', source: 'Decrypt', url: 'https://decrypt.co', publishedAt: new Date().toISOString() },
      { title: 'AI Agents Gain Traction in Crypto Markets', source: 'CoinTelegraph', url: 'https://cointelegraph.com', publishedAt: new Date().toISOString() },
      { title: 'USDC Supply Increases as Stablecoin Demand Grows', source: 'Bloomberg', url: 'https://bloomberg.com', publishedAt: new Date().toISOString() },
    ];
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=cryptocurrency+OR+avalanche+OR+bitcoin&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
    );
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
    const data = await res.json() as { articles: Array<{ title: string; source: { name: string }; url: string; publishedAt: string }> };
    return data.articles.map((a) => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));
  } catch (err) {
    console.error('NewsAPI error:', err);
    return [
      { title: 'Crypto markets show mixed signals today', source: 'Fallback', url: '#', publishedAt: new Date().toISOString() },
    ];
  }
}

async function summarizeWithGroq(articles: NewsArticle[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return `Top ${articles.length} crypto headlines: ` + articles.map((a) => a.title).join('; ') + '. Market sentiment appears cautiously optimistic.';
  }

  try {
    const groq = new Groq({ apiKey });
    const headlines = articles.map((a) => `- ${a.title} (${a.source})`).join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a crypto news analyst. Summarize the following headlines in 2-3 concise sentences focusing on market impact. Be direct and factual.' },
        { role: 'user', content: `Summarize these crypto news headlines:\n${headlines}` },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate summary.';
  } catch (err) {
    console.error('Groq summary error:', err);
    return articles.map((a) => a.title).join('. ');
  }
}

export interface NewsBotResult {
  agent: string;
  agentId: number;
  timestamp: number;
  articles: NewsArticle[];
  summary: string;
}

export async function runNewsBot(): Promise<NewsBotResult> {
  const articles = await fetchNews();
  const summary = await summarizeWithGroq(articles);

  return {
    agent: 'NewsBot',
    agentId: 1,
    timestamp: Date.now(),
    articles,
    summary,
  };
}
