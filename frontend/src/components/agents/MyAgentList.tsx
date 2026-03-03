'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMyAgents } from '@/hooks/useMyAgents';
import MyAgentCard from './MyAgentCard';

export default function MyAgentList() {
  const { myAgents, isLoading, isWalletConnected } = useMyAgents();

  if (!isWalletConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="premium-card p-12 text-center"
      >
        <p className="text-[36px] mb-4">🔗</p>
        <h2 className="text-[20px] font-semibold text-foreground mb-2">Connect Your Wallet</h2>
        <p className="text-[14px] text-foreground-secondary">
          Connect your wallet to see agents you&apos;ve deployed.
        </p>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <motion.div
          className="w-8 h-8 border-2 border-foreground-tertiary border-t-transparent rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-[14px] text-foreground-secondary">Loading your agents...</p>
      </div>
    );
  }

  if (myAgents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="premium-card p-12 text-center"
      >
        <p className="text-[36px] mb-4">🤖</p>
        <h2 className="text-[20px] font-semibold text-foreground mb-2">No Agents Yet</h2>
        <p className="text-[14px] text-foreground-secondary mb-6">
          You haven&apos;t deployed any agents. Deploy one to start earning.
        </p>
        <Link
          href="/deploy"
          className="inline-flex items-center px-5 py-2.5 bg-accent hover:bg-accent-hover rounded-full text-white text-[14px] font-medium transition-all duration-200 active:scale-[0.97]"
        >
          Deploy an Agent
        </Link>
      </motion.div>
    );
  }

  const totalEarnings = myAgents.reduce((sum, a) => sum + parseFloat(a.earnings.totalEarnings), 0);
  const totalWithdrawable = myAgents.reduce((sum, a) => sum + parseFloat(a.earnings.withdrawableEarnings), 0);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-3 gap-5"
      >
        {[
          { label: 'Total Agents', value: String(myAgents.length) },
          { label: 'Total Earnings', value: `$${totalEarnings.toFixed(4)}` },
          { label: 'Withdrawable', value: `$${totalWithdrawable.toFixed(4)}` },
        ].map((m) => (
          <div key={m.label} className="premium-card p-6 text-center">
            <p className="text-[28px] font-semibold text-foreground tracking-tight">{m.value}</p>
            <p className="text-[12px] text-foreground-tertiary mt-1">{m.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Agent cards */}
      <div className="space-y-4">
        {myAgents.map((agent, i) => (
          <MyAgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>
    </div>
  );
}
