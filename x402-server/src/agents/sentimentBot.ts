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

export interface SentimentBotResult {
  agent: string;
  agentId: number;
  timestamp: number;
  sentiment: SentimentData;
  summary: string;
}

async function fetchNewsForSentiment(): Promise<string[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    return [
      'Avalanche DeFi TVL reaches new highs',
      'Bitcoin ETF sees continued institutional inflows',
      'Regulatory concerns emerge in EU crypto markets',
      'AI integration in blockchain projects accelerates',
      'Stablecoin market cap grows to record levels',
    ];
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=crypto+sentiment+market&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
    );
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
    const data = await res.json() as { articles: Array<{ title: string }> };
    return data.articles.map((a) => a.title);
  } catch {
    return ['Crypto markets show mixed trading patterns today'];
  }
}

export async function runSentimentBot(): Promise<SentimentBotResult> {
  const headlines = await fetchNewsForSentiment();
  const apiKey = process.env.GROQ_API_KEY;

  let sentiment: SentimentData;
  let summary: string;

  if (!apiKey) {
    sentiment = {
      overall: 'Bullish',
      score: 35,
      fearGreedIndex: 62,
      breakdown: { positive: 55, negative: 20, neutral: 25 },
      topSignals: [
        'Institutional adoption increasing',
        'DeFi ecosystem growth',
        'Regulatory headwinds moderate',
      ],
    };
    summary = 'Market sentiment is cautiously bullish. Fear & Greed Index at 62 (Greed). Institutional flows and DeFi growth outweigh regulatory concerns.';
  } else {
    try {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a crypto market sentiment analyst. Analyze the headlines and return ONLY valid JSON: {"overall":"Bullish|Bearish|Neutral","score":-100 to 100,"fearGreedIndex":0-100,"breakdown":{"positive":0-100,"negative":0-100,"neutral":0-100},"topSignals":["signal1","signal2","signal3"],"summary":"2-3 sentences"}`,
          },
          { role: 'user', content: `Analyze sentiment from these headlines:\n${headlines.join('\n')}` },
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
          score: parsed.score,
          fearGreedIndex: parsed.fearGreedIndex,
          breakdown: parsed.breakdown,
          topSignals: parsed.topSignals,
        };
      } else {
        throw new Error('No JSON in response');
      }
    } catch (err) {
      console.error('SentimentBot Groq error:', err);
      sentiment = {
        overall: 'Neutral',
        score: 0,
        fearGreedIndex: 50,
        breakdown: { positive: 33, negative: 33, neutral: 34 },
        topSignals: ['Unable to analyze — defaulting to neutral'],
      };
      summary = 'Sentiment analysis unavailable. Defaulting to neutral outlook.';
    }
  }

  return {
    agent: 'SentimentBot',
    agentId: 3,
    timestamp: Date.now(),
    sentiment,
    summary,
  };
}
