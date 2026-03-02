'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import type { OrchestrationResult } from '@/types/agent';
import { X402_SERVER_URL } from '@/lib/constants';

const STEPS = [
  { label: 'TraderBot initiates', color: '#ff9500' },
  { label: 'x402 payment to DataBot', color: '#0071e3' },
  { label: 'DataBot fetches data', color: '#0071e3' },
  { label: 'x402 payment to NewsBot', color: '#28cd41' },
  { label: 'NewsBot summarizes', color: '#28cd41' },
  { label: 'AI merges signals', color: '#af52de' },
  { label: 'On-chain reputation', color: '#5ac8fa' },
];

export default function OrchestrationFlow() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState<OrchestrationResult | null>(null);

  const run = useCallback(async () => {
    setIsRunning(true);
    setResult(null);

    for (let i = 0; i < STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      const res = await fetch(`${X402_SERVER_URL}/api/orchestrate`, { method: 'POST' });
      if (res.ok) setResult(await res.json());
    } catch { /* server not running */ }

    setIsRunning(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="premium-card p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-semibold text-foreground-tertiary uppercase tracking-[0.08em]">Orchestration</p>
        <Button size="sm" onClick={run} loading={isRunning} disabled={isRunning}>
          Run
        </Button>
      </div>

      <div className="space-y-[2px]">
        {STEPS.map((step, i) => {
          const isDone = currentStep > i;
          const isActive = currentStep === i;
          const isPending = currentStep < i;

          return (
            <motion.div
              key={i}
              className="flex items-center gap-3 px-4 py-[10px] rounded-xl"
              style={{
                backgroundColor: isActive ? `${step.color}08` : 'transparent',
              }}
              animate={isActive ? { x: [0, 1, 0] } : {}}
            >
              <div
                className="w-[6px] h-[6px] rounded-full shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: isPending ? '#e5e5ea' : isDone ? '#28cd41' : step.color,
                  transform: isActive ? 'scale(1.4)' : 'scale(1)',
                }}
              />
              <span className={`text-[14px] transition-colors duration-300 ${
                isPending ? 'text-foreground-tertiary' : 'text-foreground'
              }`}>
                {step.label}
              </span>
              {isActive && isRunning && (
                <motion.div
                  className="ml-auto w-3 h-3 border-[1.5px] border-foreground-tertiary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                />
              )}
              {isDone && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto text-[12px] text-yes"
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {result?.tradingSignals && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-border"
          >
            <p className="text-[11px] font-semibold text-foreground-tertiary uppercase tracking-[0.08em] mb-4">Signals</p>
            {result.tradingSignals.signals.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <span className="text-[15px] font-medium text-foreground">{s.asset}</span>
                <span className={`text-[13px] font-semibold ${
                  s.action === 'BUY' ? 'text-yes' : s.action === 'SELL' ? 'text-no' : 'text-foreground-secondary'
                }`}>
                  {s.action}
                </span>
                <span className="text-[13px] text-foreground-tertiary">{s.confidence}%</span>
              </div>
            ))}
            <p className="text-[12px] text-foreground-tertiary mt-3">
              ${result.totalCost} USDC &middot; {result.duration}ms
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
