'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityRecord } from '@/types/agent';
import { timeAgo } from '@/lib/utils';

export default function ActivityFeed({ activities }: { activities: ActivityRecord[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="premium-card p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-semibold text-foreground-tertiary uppercase tracking-[0.08em]">Live Activity</p>
        <div className="flex items-center gap-2">
          <span className="w-[6px] h-[6px] rounded-full bg-yes live-dot" />
          <span className="text-[12px] text-foreground-tertiary">{activities.length} events</span>
        </div>
      </div>

      <div className="space-y-0 max-h-[380px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {activities.slice(0, 15).map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-4 py-3.5 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-medium text-foreground">{a.fromAgent}</span>
                  {a.toAgent && (
                    <>
                      <span className="text-foreground-tertiary text-[13px]">→</span>
                      <span className="text-[14px] text-foreground-secondary">{a.toAgent}</span>
                    </>
                  )}
                </div>
                <p className="text-[12px] text-foreground-tertiary truncate mt-0.5">{a.description}</p>
              </div>
              <div className="text-right shrink-0">
                {parseFloat(a.amount) > 0 && (
                  <p className="text-[14px] font-semibold text-foreground">${a.amount}</p>
                )}
                <p className="text-[11px] text-foreground-tertiary">{timeAgo(a.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[15px] text-foreground-secondary">No activity yet</p>
            <p className="text-[13px] text-foreground-tertiary mt-1">Run an orchestration to begin</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
