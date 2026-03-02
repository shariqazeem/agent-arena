'use client';

import type { AgentReputation } from '@/types/agent';

export default function ReputationBar({ reputation }: { reputation: AgentReputation }) {
  const score = reputation.compositeScore;
  const pct = Math.min(100, score / 10);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[12px] text-foreground-secondary">Reputation</span>
        <span className="text-[20px] font-semibold text-foreground tracking-tight">{score}</span>
      </div>
      <div className="h-[3px] bg-background-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
