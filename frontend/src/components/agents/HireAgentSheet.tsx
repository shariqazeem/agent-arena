'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Agent } from '@/types/agent';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { useHireAgent } from '@/hooks/useHireAgent';

/* ---------- result renderers ---------- */

function TradingSignals({ signals }: { signals: Array<{ asset: string; action: string; confidence: number; reasoning: string; riskLevel?: string; timeframe?: string }> }) {
  const actionColor: Record<string, string> = {
    BUY: 'text-yes bg-yes/8',
    SELL: 'text-no bg-no/8',
    HOLD: 'text-foreground-secondary bg-background-secondary',
  };
  const riskColor: Record<string, string> = {
    LOW: 'text-yes',
    MEDIUM: 'text-foreground-secondary',
    HIGH: 'text-no',
  };
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">Trading Signals</p>
      {signals.map((s) => (
        <div key={s.asset} className="bg-background-secondary rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${actionColor[s.action] || actionColor.HOLD}`}>
              {s.action}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-foreground">{s.asset}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[16px] font-semibold text-foreground">{s.confidence}%</p>
              <p className="text-[10px] text-foreground-tertiary">confidence</p>
            </div>
          </div>
          <p className="text-[12px] text-foreground-tertiary mt-2">{s.reasoning}</p>
          {(s.riskLevel || s.timeframe) && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
              {s.riskLevel && (
                <span className={`text-[10px] font-medium ${riskColor[s.riskLevel] || riskColor.MEDIUM}`}>
                  {s.riskLevel} RISK
                </span>
              )}
              {s.timeframe && (
                <span className="text-[10px] text-foreground-tertiary">{s.timeframe}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PriceFeeds({ feeds }: { feeds: Array<{ pair: string; price: number; source: string }> }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">Price Feeds</p>
      <div className="grid grid-cols-2 gap-3">
        {feeds.map((f) => (
          <div key={f.pair} className="bg-background-secondary rounded-2xl p-4 text-center">
            <p className="text-[12px] text-foreground-tertiary">{f.pair}</p>
            <p className="text-[20px] font-semibold text-foreground tracking-tight mt-1">
              ${f.price < 100 ? f.price.toFixed(2) : f.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsList({ articles }: { articles: Array<{ title: string; source: string }> }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">Headlines</p>
      <div className="space-y-2">
        {articles.slice(0, 5).map((a, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
            <span className="text-[11px] text-foreground-tertiary shrink-0 mt-0.5">{a.source}</span>
            <p className="text-[13px] text-foreground leading-snug">{a.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Summary({ text }: { text: string }) {
  return (
    <div className="bg-background-secondary rounded-2xl p-5">
      <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider mb-2">Summary</p>
      <p className="text-[14px] text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function SettlementCard({ price, isBuiltin }: { price: string; isBuiltin: boolean }) {
  return (
    <div className="bg-background-secondary rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">Settlement Details</p>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${isBuiltin ? 'bg-yes/8 text-yes' : 'bg-foreground-tertiary/10 text-foreground-secondary'}`}>
          {isBuiltin ? 'x402 Enabled' : 'Demo Mode'}
        </span>
      </div>
      <div className="space-y-2">
        {[
          ['Protocol', 'x402 (HTTP 402)'],
          ['Network', 'Avalanche C-Chain'],
          ['Amount', `$${price} USDC`],
          ['Finality', '~2s'],
          ['Gas', '~$0.001'],
          ['Currency', 'USDC (EIP-3009)'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between items-center">
            <span className="text-[12px] text-foreground-tertiary">{k}</span>
            <span className="text-[12px] font-medium text-foreground">{v}</span>
          </div>
        ))}
      </div>
      {!isBuiltin && (
        <p className="text-[10px] text-foreground-tertiary mt-3 pt-3 border-t border-border">
          In production, this query would be gated by x402 — the agent owner receives ${price} USDC per call, settled on-chain.
        </p>
      )}
    </div>
  );
}

function formatValue(key: string, v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'string') return v.slice(0, 60);
  if (typeof v !== 'number') return String(v);
  const k = key.toLowerCase();
  // Dollar amounts — only explicit financial keys
  if (k.includes('tvl') || k.includes('usd') || k.includes('liquidity') || k.includes('price')) {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toFixed(2)}`;
  }
  // Percentages — narrow to APY/APR
  if (k.includes('apy') || k.includes('apr')) {
    return `${v.toFixed(2)}%`;
  }
  if (v < 0.01 && v > 0) return v.toExponential(2);
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function TextResult({ text }: { text: string }) {
  // Basic markdown-ish rendering: headers, bullets, paragraphs
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('# '))
          return <p key={i} className="text-[16px] font-semibold text-foreground">{trimmed.slice(2)}</p>;
        if (trimmed.startsWith('## '))
          return <p key={i} className="text-[14px] font-semibold text-foreground">{trimmed.slice(3)}</p>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* '))
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary mt-1.5 shrink-0" />
              <p className="text-[13px] text-foreground-secondary">{trimmed.slice(2)}</p>
            </div>
          );
        return <p key={i} className="text-[13px] text-foreground-secondary leading-relaxed">{trimmed}</p>;
      })}
    </div>
  );
}

function ObjectArrayResult({ items }: { items: Record<string, unknown>[] }) {
  const display = items.slice(0, 12);
  return (
    <div className="space-y-2">
      {display.map((item, i) => {
        const entries = Object.entries(item)
          .filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
          .slice(0, 10);
        const titleEntry = entries.find(([, v]) => typeof v === 'string' && !String(v).startsWith('0x'));

        return (
          <div key={i} className="bg-background-secondary rounded-2xl p-4">
            {titleEntry && (
              <p className="text-[14px] font-medium text-foreground mb-2">{String(titleEntry[1])}</p>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {entries
                .filter(([k]) => k !== titleEntry?.[0])
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[10px] text-foreground-tertiary">{k}</span>
                    <p className="text-[13px] font-medium text-foreground">{formatValue(k, v)}</p>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
      {items.length > 12 && (
        <p className="text-[11px] text-foreground-tertiary text-center">+ {items.length - 12} more records</p>
      )}
    </div>
  );
}

function PrimitiveArrayResult({ items }: { items: unknown[] }) {
  return (
    <div className="space-y-1.5">
      {items.slice(0, 25).map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary mt-1.5 shrink-0" />
          <p className="text-[13px] text-foreground-secondary">{String(item)}</p>
        </div>
      ))}
      {items.length > 25 && (
        <p className="text-[11px] text-foreground-tertiary text-center">+ {items.length - 25} more items</p>
      )}
    </div>
  );
}

function SingleObjectResult({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(
    ([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
  );
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex justify-between items-start py-1.5">
          <span className="text-[13px] text-foreground-tertiary shrink-0">{k}</span>
          <span className="text-[13px] text-foreground text-right ml-4">{formatValue(k, v)}</span>
        </div>
      ))}
    </div>
  );
}

function ExternalAgentResult({ result }: { result: Record<string, any> }) {
  const data = result.data;
  const shape: string = result._dataShape || inferShape(data);
  const sourceDomain = result._endpoint ? extractDomain(result._endpoint) : null;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent/8 text-accent">
          External Agent
        </span>
        {sourceDomain && (
          <span className="text-[12px] text-foreground-tertiary">{sourceDomain}</span>
        )}
        {result._recordCount != null && (
          <span className="text-[12px] text-foreground-tertiary">{result._recordCount.toLocaleString()} records</span>
        )}
      </div>

      {/* Shape-aware rendering */}
      {shape === 'string' && <TextResult text={String(data)} />}
      {shape === 'array-of-objects' && <ObjectArrayResult items={data} />}
      {shape === 'array-of-primitives' && <PrimitiveArrayResult items={data} />}
      {shape === 'object' && <SingleObjectResult data={data} />}

      {/* Summary */}
      {result.summary && typeof result.summary === 'string' && (
        <Summary text={result.summary} />
      )}
    </div>
  );
}

function inferShape(data: unknown): string {
  if (typeof data === 'string') return 'string';
  if (Array.isArray(data)) {
    if (data.length === 0) return 'array-of-primitives';
    return typeof data[0] === 'object' && data[0] !== null ? 'array-of-objects' : 'array-of-primitives';
  }
  if (typeof data === 'object' && data !== null) return 'object';
  return 'string';
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function FormattedResult({ result }: { result: Record<string, unknown> }) {
  const r = result as Record<string, any>;

  // External agent response — use generic renderer
  if (r._external) {
    return <ExternalAgentResult result={r} />;
  }

  // Check if any known field matches — if not, fall back to generic
  const hasKnownField = r.signals || r.chainlinkFeeds || r.articles || r.sentiment ||
    r.trending || r.marketData || r.summary || r.riskDisclaimer ||
    r.dataSources?.dataBot?.chainlinkFeeds || r.dataSources?.newsBot?.articles;

  if (!hasKnownField) {
    return <ExternalAgentResult result={{ ...r, _external: true, data: r, summary: null }} />;
  }

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto">
      {/* Trading Signals (TraderBot) */}
      {r.signals && Array.isArray(r.signals) && (
        <TradingSignals signals={r.signals} />
      )}

      {/* Price feeds (DataBot) */}
      {r.chainlinkFeeds && Array.isArray(r.chainlinkFeeds) && (
        <PriceFeeds feeds={r.chainlinkFeeds} />
      )}

      {/* Nested DataBot feeds (from TraderBot) */}
      {r.dataSources?.dataBot?.chainlinkFeeds && (
        <PriceFeeds feeds={r.dataSources.dataBot.chainlinkFeeds} />
      )}

      {/* News articles (NewsBot) */}
      {r.articles && Array.isArray(r.articles) && (
        <NewsList articles={r.articles} />
      )}

      {/* Nested NewsBot articles (from TraderBot) */}
      {r.dataSources?.newsBot?.articles && (
        <NewsList articles={r.dataSources.newsBot.articles} />
      )}

      {/* Sentiment data (SentimentBot) */}
      {r.sentiment && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">Sentiment Analysis</p>
          <div className="grid grid-cols-2 gap-3">
            {r.sentiment.overall && (
              <div className="bg-background-secondary rounded-2xl p-4 text-center">
                <p className="text-[12px] text-foreground-tertiary">Overall</p>
                <p className={`text-[18px] font-semibold mt-1 ${r.sentiment.overall === 'Bullish' ? 'text-yes' : r.sentiment.overall === 'Bearish' ? 'text-no' : 'text-foreground'}`}>
                  {r.sentiment.overall}
                </p>
              </div>
            )}
            {r.sentiment.fearGreedIndex != null && (
              <div className="bg-background-secondary rounded-2xl p-4 text-center">
                <p className="text-[12px] text-foreground-tertiary">Fear & Greed</p>
                <p className="text-[18px] font-semibold text-foreground mt-1">{r.sentiment.fearGreedIndex}</p>
              </div>
            )}
          </div>
          {r.sentiment.topSignals && Array.isArray(r.sentiment.topSignals) && (
            <div className="space-y-1.5">
              {r.sentiment.topSignals.map((sig: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary mt-1.5 shrink-0" />
                  <p className="text-[12px] text-foreground-secondary">{sig}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trending coins (SentimentBot) */}
      {r.trending && Array.isArray(r.trending) && r.trending.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">Trending</p>
          <div className="flex flex-wrap gap-2">
            {r.trending.map((t: { name: string; symbol: string; priceChange24h: number }, i: number) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background-secondary rounded-full text-[12px]">
                <span className="font-medium text-foreground">{t.symbol}</span>
                <span className={t.priceChange24h >= 0 ? 'text-yes' : 'text-no'}>
                  {t.priceChange24h >= 0 ? '+' : ''}{t.priceChange24h?.toFixed(1)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Market data (DataBot) */}
      {r.marketData && Array.isArray(r.marketData) && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">Market Data</p>
          <div className="grid grid-cols-2 gap-3">
            {r.marketData.map((m: { symbol: string; price: number; change24h: number }) => (
              <div key={m.symbol} className="bg-background-secondary rounded-2xl p-4">
                <p className="text-[12px] text-foreground-tertiary">{m.symbol}</p>
                <p className="text-[18px] font-semibold text-foreground tracking-tight mt-1">
                  ${m.price < 100 ? m.price.toFixed(2) : m.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className={`text-[12px] mt-0.5 ${m.change24h >= 0 ? 'text-yes' : 'text-no'}`}>
                  {m.change24h >= 0 ? '+' : ''}{m.change24h?.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary (all agents have this) */}
      {r.summary && typeof r.summary === 'string' && (
        <Summary text={r.summary} />
      )}

      {/* Risk disclaimer (TraderBot) */}
      {r.riskDisclaimer && (
        <p className="text-[10px] text-foreground-tertiary text-center italic px-4">{r.riskDisclaimer}</p>
      )}
    </div>
  );
}

/* ---------- main component ---------- */

export default function HireAgentSheet({ agent, isOpen, onClose }: { agent: Agent; isOpen: boolean; onClose: () => void }) {
  const { hireAgent, result, isLoading, error } = useHireAgent();
  const [step, setStep] = useState<'confirm' | 'loading' | 'result'>('confirm');

  const handleHire = async () => {
    setStep('loading');
    const res = await hireAgent(agent.id, agent.endpoint);
    setStep(res ? 'result' : 'confirm');
  };

  const handleClose = () => { setStep('confirm'); onClose(); };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={`Hire ${agent.name}`}>
      {step === 'confirm' && (
        <div className="space-y-5">
          <div className="space-y-3">
            {[
              ['Cost', `$${agent.pricePerQuery} USDC`],
              ['Network', 'Avalanche Fuji'],
              ['Protocol', 'x402'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-[14px] text-foreground-secondary">{k}</span>
                <span className="text-[14px] font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
          {error && <p className="text-[14px] text-no">{error}</p>}
          <Button className="w-full" onClick={handleHire} loading={isLoading}>
            Pay & Execute
          </Button>
        </div>
      )}

      {step === 'loading' && (
        <div className="text-center py-12">
          <motion.div
            className="w-8 h-8 border-2 border-foreground-tertiary border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-[14px] text-foreground-secondary">Executing {agent.name}...</p>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="text-center py-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yes/8 text-yes text-[13px] font-medium">
              <span className="w-[6px] h-[6px] rounded-full bg-yes" />
              Execution Complete
            </span>
          </motion.div>

          <FormattedResult result={result} />

          <SettlementCard price={agent.pricePerQuery} isBuiltin={agent.endpoint.startsWith('/api/')} />

          <Button variant="secondary" className="w-full" onClick={handleClose}>Done</Button>
        </div>
      )}
    </BottomSheet>
  );
}
