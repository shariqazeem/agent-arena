'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Agent } from '@/types/agent';
import { SERVICE_TYPES } from '@/lib/constants';
import Button from '@/components/ui/Button';
import ReputationBar from './ReputationBar';
import HireAgentSheet from './HireAgentSheet';

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

export default function AgentProfile({ agent }: { agent: Agent }) {
  const [showHire, setShowHire] = useState(false);
  const service = SERVICE_TYPES[agent.serviceType];

  return (
    <div className="max-w-[640px] mx-auto space-y-5">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="premium-card p-8 text-center">
        <div className="w-20 h-20 rounded-[22px] flex items-center justify-center text-[36px] bg-background-secondary mx-auto mb-5">
          {service?.icon || '🤖'}
        </div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">{agent.name}</h1>
        <p className="text-[14px] text-foreground-tertiary mt-1">{service?.label || 'Agent'}</p>
        <p className="text-[15px] text-foreground-secondary mt-4 leading-relaxed max-w-md mx-auto">
          {agent.description}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className={`w-[6px] h-[6px] rounded-full ${agent.isActive ? 'bg-yes' : 'bg-no'}`} />
          <span className="text-[13px] text-foreground-secondary">{agent.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      </motion.div>

      {/* Key metrics */}
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-3 gap-5">
        {[
          { label: 'Price', value: `$${agent.pricePerQuery}` },
          { label: 'Success', value: `${(agent.reputation.successRate / 100).toFixed(0)}%` },
          { label: 'Rating', value: (agent.reputation.avgRating / 100).toFixed(1) },
        ].map((m) => (
          <div key={m.label} className="premium-card p-6 text-center">
            <p className="text-[28px] font-semibold text-foreground tracking-tight">{m.value}</p>
            <p className="text-[12px] text-foreground-tertiary mt-1">{m.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Reputation */}
      <motion.div {...fadeUp(0.2)} className="premium-card p-8">
        <ReputationBar reputation={agent.reputation} />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-[13px] text-foreground-tertiary">{agent.reputation.totalTxns} total transactions</span>
          <span className="text-[13px] text-foreground-tertiary font-mono">NFT #{agent.id}</span>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeUp(0.3)}>
        <Button
          size="lg"
          className="w-full"
          onClick={() => setShowHire(true)}
          disabled={!agent.isActive}
        >
          Hire Agent — ${agent.pricePerQuery} USDC
        </Button>
      </motion.div>

      <HireAgentSheet agent={agent} isOpen={showHire} onClose={() => setShowHire(false)} />
    </div>
  );
}
