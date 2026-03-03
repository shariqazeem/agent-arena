'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import type { MyAgent } from '@/hooks/useMyAgents';
import { getServiceType, X402_SERVER_URL } from '@/lib/constants';
import { snowtraceUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function MyAgentCard({ agent, index = 0 }: { agent: MyAgent; index?: number }) {
  const service = getServiceType(agent.serviceType);
  const { address } = useAccount();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null);

  const withdraw = useCallback(async () => {
    if (!address) return;
    setIsWithdrawing(true);
    setWithdrawTxHash(null);
    try {
      const res = await fetch(`${X402_SERVER_URL}/api/agents/${agent.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: address }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Withdrawal failed');
      }
      const data = await res.json();
      setWithdrawTxHash(data.txHash);
    } catch (err) {
      console.error('Withdraw error:', err);
    } finally {
      setIsWithdrawing(false);
    }
  }, [address, agent.id]);

  const hasWithdrawable = parseFloat(agent.earnings.withdrawableEarnings) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="premium-card p-6">
        {/* Top row: icon, name, status */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] bg-background-secondary shrink-0">
            {service.icon}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/agents/${agent.id}`} className="text-[16px] font-semibold text-foreground hover:text-accent transition-colors tracking-tight">
              {agent.name}
            </Link>
            <p className="text-[12px] text-foreground-tertiary">{service.label}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-[6px] h-[6px] rounded-full ${agent.isActive ? 'bg-yes' : 'bg-no'}`} />
            <span className="text-[12px] text-foreground-secondary">{agent.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Hires', value: String(agent.earnings.paymentCount) },
            { label: 'Earned', value: `$${agent.earnings.totalEarnings}` },
            { label: 'Withdrawable', value: `$${agent.earnings.withdrawableEarnings}` },
            { label: 'Per Query', value: `$${agent.pricePerQuery}` },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-[16px] font-semibold text-foreground tracking-tight">{m.value}</p>
              <p className="text-[10px] text-foreground-tertiary mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Withdraw */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="flex-1"
            disabled={!hasWithdrawable || isWithdrawing}
            onClick={withdraw}
            loading={isWithdrawing}
          >
            {isWithdrawing ? 'Withdrawing...' : `Withdraw $${agent.earnings.withdrawableEarnings}`}
          </Button>
          {withdrawTxHash && (
            <a
              href={snowtraceUrl('tx', withdrawTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-accent hover:underline font-mono shrink-0"
            >
              View tx
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
