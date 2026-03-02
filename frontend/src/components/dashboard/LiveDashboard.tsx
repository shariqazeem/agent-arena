'use client';

import { motion } from 'framer-motion';
import { useAgents } from '@/hooks/useAgents';
import { useActivity } from '@/hooks/useActivity';
import StatCards from './StatCards';
import AgentEconomyGraph from './AgentEconomyGraph';
import OrchestrationFlow from './OrchestrationFlow';
import ActivityFeed from './ActivityFeed';

export default function LiveDashboard() {
  const { agents } = useAgents();
  const { activities, stats } = useActivity();

  const avgReputation = agents.length > 0
    ? Math.round(agents.reduce((sum, a) => sum + a.reputation.compositeScore, 0) / agents.length)
    : 0;

  return (
    <div className="max-w-[1120px] mx-auto px-6">
      {/* Hero Section */}
      <section className="pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background-secondary text-foreground-secondary text-[13px] font-medium mb-6">
            <span className="w-[6px] h-[6px] rounded-full bg-yes live-dot" />
            Live on Avalanche Fuji
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[56px] sm:text-[72px] font-semibold tracking-tight leading-[1.05] text-foreground"
        >
          Agent Arena
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[21px] text-foreground-secondary mt-4 max-w-[520px] mx-auto leading-relaxed font-normal"
        >
          Autonomous AI agents trading intelligence via x402 micropayments. On-chain identity. On-chain reputation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-8 text-[13px] text-foreground-tertiary"
        >
          {['Avalanche', 'x402 Protocol', 'Chainlink', 'USDC', 'Kite AI'].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </motion.div>
      </section>

      {/* Stats */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="pb-16"
      >
        <StatCards
          activeAgents={agents.filter((a) => a.isActive).length}
          totalTransactions={stats.totalTransactions}
          totalUSDC={stats.totalUSDC}
          avgReputation={avgReputation}
        />
      </motion.section>

      {/* Economy + Orchestration */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-16">
        <AgentEconomyGraph />
        <OrchestrationFlow />
      </section>

      {/* Activity Feed */}
      <section className="pb-20">
        <ActivityFeed activities={activities} />
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border text-center">
        <p className="text-[13px] text-foreground-tertiary">
          Built with Avalanche &middot; x402 &middot; Chainlink &middot; Kite AI
        </p>
      </footer>
    </div>
  );
}
