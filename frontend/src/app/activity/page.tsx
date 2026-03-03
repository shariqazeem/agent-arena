'use client';

import { motion } from 'framer-motion';
import { useActivity } from '@/hooks/useActivity';
import { timeAgo, snowtraceUrl } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { label: string }> = {
  x402_payment: { label: 'Payment' },
  agent_call: { label: 'Agent Call' },
  orchestration: { label: 'Orchestration' },
  reputation_update: { label: 'Reputation' },
};

export default function ActivityPage() {
  const { activities, stats, isLoading } = useActivity();

  return (
    <div className="max-w-[960px] mx-auto px-6 pt-16 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-center mb-12"
      >
        <h1 className="text-[40px] font-semibold tracking-tight text-foreground">Activity</h1>
        <p className="text-[17px] text-foreground-secondary mt-2">
          Real-time log of agent interactions and x402 payments.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        className="grid grid-cols-3 gap-5 mb-10"
      >
        {[
          { label: 'Transactions', value: stats.totalTransactions },
          { label: 'Volume', value: `$${stats.totalUSDC}` },
          { label: 'Active Agents', value: stats.activeAgents },
        ].map((stat) => (
          <div key={stat.label} className="premium-card p-6 text-center">
            <p className="text-[28px] font-semibold text-foreground tracking-tight">{stat.value}</p>
            <p className="text-[12px] text-foreground-tertiary mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Activity List */}
      <div className="premium-card divide-y divide-border">
        {isLoading && (
          <p className="text-center text-foreground-tertiary py-20 text-[15px]">Loading activity...</p>
        )}

        {!isLoading && activities.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[15px] text-foreground-secondary">No activity yet</p>
            <p className="text-[13px] text-foreground-tertiary mt-1">Start the server and run an orchestration</p>
          </div>
        )}

        {activities.map((activity, i) => {
          const config = TYPE_CONFIG[activity.type] || { label: activity.type };
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-5 px-7 py-5"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-background-secondary text-foreground-secondary shrink-0">
                {config.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="font-medium text-foreground">{activity.fromAgent}</span>
                  {activity.toAgent && (
                    <>
                      <span className="text-foreground-tertiary">&rarr;</span>
                      <span className="text-foreground-secondary">{activity.toAgent}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[13px] text-foreground-tertiary truncate">{activity.description}</p>
                  {activity.txHash && (
                    <a
                      href={snowtraceUrl('tx', activity.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent hover:underline shrink-0"
                    >
                      View on Snowtrace
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {parseFloat(activity.amount) > 0 && (
                  <p className="text-[14px] font-semibold text-foreground">${activity.amount}</p>
                )}
                <p className="text-[11px] text-foreground-tertiary">{timeAgo(activity.timestamp)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
