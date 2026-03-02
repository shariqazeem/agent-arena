'use client';

import { motion } from 'framer-motion';

interface StatCardsProps {
  activeAgents: number;
  totalTransactions: number;
  totalUSDC: string;
  avgReputation: number;
}

export default function StatCards({ activeAgents, totalTransactions, totalUSDC, avgReputation }: StatCardsProps) {
  const stats = [
    { label: 'Active Agents', value: activeAgents },
    { label: 'Transactions', value: totalTransactions },
    { label: 'USDC Volume', value: `$${totalUSDC}` },
    { label: 'Avg Score', value: avgReputation },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
          className="premium-card p-7 text-center"
        >
          <p className="text-[40px] font-semibold tracking-tight text-foreground leading-none">
            {stat.value}
          </p>
          <p className="text-[13px] text-foreground-secondary mt-2">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
