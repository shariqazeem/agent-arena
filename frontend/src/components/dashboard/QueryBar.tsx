'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X402_SERVER_URL } from '@/lib/constants';

interface QueryResult {
  query: string;
  agentsUsed: string[];
  response: string;
  data: Record<string, unknown>;
  totalCost: string;
  duration: number;
}

const EXAMPLE_QUERIES = [
  'What is the current price of AVAX?',
  'Should I buy or sell Bitcoin right now?',
  'What is the market sentiment today?',
  'Latest crypto news and market impact?',
];

export default function QueryBar() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  const handleQuery = useCallback(async (q?: string) => {
    const text = q || query;
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setQuery(text);

    try {
      const res = await fetch(`${X402_SERVER_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch {
      // Server not available
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="premium-card p-6"
    >
      <p className="text-[11px] font-semibold text-foreground-tertiary uppercase tracking-[0.08em] mb-4">
        Ask the Agents
      </p>

      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          placeholder="Ask anything about crypto markets..."
          className="flex-1 bg-background-secondary rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-tertiary outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
        />
        <button
          onClick={() => handleQuery()}
          disabled={isLoading || !query.trim()}
          className="px-5 py-3 bg-foreground text-background rounded-xl text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isLoading ? (
            <motion.div
              className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            'Ask'
          )}
        </button>
      </div>

      {/* Example queries */}
      {!result && !isLoading && (
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLE_QUERIES.map((eq) => (
            <button
              key={eq}
              onClick={() => handleQuery(eq)}
              className="px-3 py-1.5 bg-background-secondary rounded-full text-[12px] text-foreground-secondary hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              {eq}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 pt-5 border-t border-border"
          >
            {/* Agents used badge */}
            <div className="flex items-center gap-2 mb-3">
              {result.agentsUsed.map((agent) => (
                <span
                  key={agent}
                  className="px-2.5 py-1 bg-background-secondary rounded-full text-[11px] font-medium text-foreground-secondary"
                >
                  {agent}
                </span>
              ))}
              <span className="text-[11px] text-foreground-tertiary ml-auto">
                ${result.totalCost} USDC &middot; {result.duration}ms
              </span>
            </div>

            {/* AI Response */}
            <p className="text-[14px] text-foreground leading-relaxed">
              {result.response}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
