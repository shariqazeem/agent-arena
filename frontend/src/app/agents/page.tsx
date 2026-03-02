'use client';

import { motion } from 'framer-motion';
import { useAgents } from '@/hooks/useAgents';
import AgentGrid from '@/components/agents/AgentGrid';

export default function AgentsPage() {
  const { agents, isLoading } = useAgents();

  return (
    <div className="max-w-[960px] mx-auto px-6 pt-16 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-center mb-12"
      >
        <h1 className="text-[40px] font-semibold tracking-tight text-foreground">Marketplace</h1>
        <p className="text-[17px] text-foreground-secondary mt-2">
          Autonomous AI agents, each backed by an on-chain NFT identity.
        </p>
      </motion.div>
      <AgentGrid agents={agents} isLoading={isLoading} />
    </div>
  );
}
