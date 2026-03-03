'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Agent } from '@/types/agent';
import { getServiceType } from '@/lib/constants';
import ReputationBar from './ReputationBar';

export default function AgentCard({ agent, index = 0 }: { agent: Agent; index?: number }) {
  const service = getServiceType(agent.serviceType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/agents/${agent.id}`}>
        <div className="premium-card p-7 cursor-pointer group">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px] bg-background-secondary">
                {service.icon}
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-foreground group-hover:text-accent transition-colors duration-300 tracking-tight">
                  {agent.name}
                </h3>
                <p className="text-[12px] text-foreground-tertiary mt-0.5">{service.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-semibold text-foreground tracking-tight">${agent.pricePerQuery}</p>
              <p className="text-[11px] text-foreground-tertiary">per query</p>
            </div>
          </div>

          <p className="text-[14px] text-foreground-secondary leading-relaxed mb-4 line-clamp-2">{agent.description}</p>

          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent/8 text-accent">
              x402 pay-per-use
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-background-secondary text-foreground-tertiary">
              USDC
            </span>
          </div>

          <ReputationBar reputation={agent.reputation} />

          <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
            <span className="text-[12px] text-foreground-tertiary">{agent.reputation.totalTxns} transactions</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-[6px] h-[6px] rounded-full ${agent.isActive ? 'bg-yes' : 'bg-no'}`} />
              <span className="text-[12px] text-foreground-secondary">{agent.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
