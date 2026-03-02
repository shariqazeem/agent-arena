'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Agent } from '@/types/agent';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { useHireAgent } from '@/hooks/useHireAgent';

/* ---------- result renderers ---------- */

function TradingSignals({ signals }: { signals: Array<{ asset: string; action: string; confidence: number; reasoning: string }> }) {
  const actionColor: Record<string, string> = {
    BUY: 'text-yes bg-yes/8',
    SELL: 'text-no bg-no/8',
    HOLD: 'text-foreground-secondary bg-background-secondary',
  };
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">Trading Signals</p>
      {signals.map((s) => (
        <div key={s.asset} className="flex items-center gap-3 bg-background-secondary rounded-2xl p-4">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${actionColor[s.action] || actionColor.HOLD}`}>
            {s.action}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-foreground">{s.asset}</p>
            <p className="text-[12px] text-foreground-tertiary truncate">{s.reasoning}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[16px] font-semibold text-foreground">{s.confidence}%</p>
            <p className="text-[10px] text-foreground-tertiary">confidence</p>
          </div>
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

function FormattedResult({ result }: { result: Record<string, unknown> }) {
  const r = result as Record<string, any>;

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
                <p className="text-[18px] font-semibold text-foreground mt-1 capitalize">{r.sentiment.overall}</p>
              </div>
            )}
            {r.sentiment.fearGreedIndex != null && (
              <div className="bg-background-secondary rounded-2xl p-4 text-center">
                <p className="text-[12px] text-foreground-tertiary">Fear & Greed</p>
                <p className="text-[18px] font-semibold text-foreground mt-1">{r.sentiment.fearGreedIndex}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary (all agents have this) */}
      {r.summary && typeof r.summary === 'string' && (
        <Summary text={r.summary} />
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
    const res = await hireAgent(agent.endpoint);
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

          <Button variant="secondary" className="w-full" onClick={handleClose}>Done</Button>
        </div>
      )}
    </BottomSheet>
  );
}
