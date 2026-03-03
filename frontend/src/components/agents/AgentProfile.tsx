'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import type { Agent } from '@/types/agent';
import { getServiceType, AGENT_REGISTRY_ADDRESS } from '@/lib/constants';
import { shortenAddress, snowtraceUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import ReputationBar from './ReputationBar';
import HireAgentSheet from './HireAgentSheet';
import { useAgentEarnings } from '@/hooks/useAgentEarnings';

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

export default function AgentProfile({ agent }: { agent: Agent }) {
  const [showHire, setShowHire] = useState(false);
  const service = getServiceType(agent.serviceType);
  const { address } = useAccount();
  const isOwner = address && agent.owner && address.toLowerCase() === agent.owner.toLowerCase();
  const {
    totalEarnings,
    withdrawableEarnings,
    paymentCount,
    recentPayments,
    isWithdrawing,
    withdrawTxHash,
    withdraw,
  } = useAgentEarnings(agent.id);

  return (
    <div className="max-w-[640px] mx-auto space-y-5">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="premium-card p-8 text-center">
        <div className="w-20 h-20 rounded-[22px] flex items-center justify-center text-[36px] bg-background-secondary mx-auto mb-5">
          {service.icon}
        </div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">{agent.name}</h1>
        <p className="text-[14px] text-foreground-tertiary mt-1">{service.label}</p>
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
          <a
            href={snowtraceUrl('token', `${AGENT_REGISTRY_ADDRESS}?a=${agent.id}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-accent hover:underline font-mono"
          >
            NFT #{agent.id}
          </a>
        </div>
      </motion.div>

      {/* Service details */}
      <motion.div {...fadeUp(0.3)} className="premium-card p-8">
        <p className="text-[11px] font-semibold text-foreground-tertiary uppercase tracking-[0.08em] mb-4">Service Details</p>
        <div className="space-y-3">
          {[
            ['Protocol', 'x402 (HTTP 402 Payment Required)'],
            ['Payment', `$${agent.pricePerQuery} USDC per query`],
            ['Chain', 'Avalanche Fuji (43113)'],
            ['Finality', '~2s'],
            ['Settlement', 'EIP-3009 transferWithAuthorization'],
            ['Endpoint', agent.endpoint],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-start py-1.5">
              <span className="text-[13px] text-foreground-tertiary shrink-0">{k}</span>
              <span className="text-[13px] text-foreground text-right ml-4 font-mono">{v}</span>
            </div>
          ))}
          {agent.owner && agent.owner !== '0x0000000000000000000000000000000000000000' && (
            <div className="flex justify-between items-start py-1.5">
              <span className="text-[13px] text-foreground-tertiary shrink-0">Owner</span>
              <a
                href={snowtraceUrl('address', agent.owner)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-accent hover:underline ml-4 font-mono"
              >
                {shortenAddress(agent.owner)}
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Owner Earnings (only visible to agent owner) */}
      {isOwner && (
        <motion.div {...fadeUp(0.35)} className="premium-card p-8">
          <p className="text-[11px] font-semibold text-foreground-tertiary uppercase tracking-[0.08em] mb-4">Your Earnings</p>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="text-center">
              <p className="text-[28px] font-semibold text-foreground tracking-tight">${totalEarnings}</p>
              <p className="text-[12px] text-foreground-tertiary mt-1">Total USDC</p>
            </div>
            <div className="text-center">
              <p className="text-[28px] font-semibold text-foreground tracking-tight">{paymentCount}</p>
              <p className="text-[12px] text-foreground-tertiary mt-1">Payments</p>
            </div>
          </div>
          {/* Withdraw button */}
          <div className="mb-5">
            <Button
              size="sm"
              className="w-full"
              disabled={parseFloat(withdrawableEarnings) <= 0 || isWithdrawing}
              onClick={() => address && withdraw(address)}
            >
              {isWithdrawing ? 'Withdrawing...' : `Withdraw $${withdrawableEarnings} USDC to Wallet`}
            </Button>
            {withdrawTxHash && (
              <div className="mt-3 p-3 rounded-lg bg-yes/10 border border-yes/20">
                <p className="text-[13px] text-yes font-medium">Withdrawal successful!</p>
                <a
                  href={snowtraceUrl('tx', withdrawTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-accent hover:underline font-mono break-all"
                >
                  View on Snowtrace
                </a>
              </div>
            )}
          </div>
          {recentPayments.length > 0 && (
            <div className="space-y-0 border-t border-border">
              {recentPayments.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13px] text-foreground">{p.from} &rarr; {agent.name}</p>
                    <p className="text-[11px] text-foreground-tertiary truncate">{p.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[14px] font-semibold text-foreground">${p.amount}</p>
                    {p.txHash && (
                      <a
                        href={snowtraceUrl('tx', p.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-accent hover:underline"
                      >
                        Snowtrace
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* CTA */}
      <motion.div {...fadeUp(0.4)}>
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
