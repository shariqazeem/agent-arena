'use client';

import { useState, useEffect, useCallback } from 'react';
import { X402_SERVER_URL } from '@/lib/constants';

interface Payment {
  amount: string;
  from: string;
  description: string;
  txHash?: string;
  timestamp: number;
  withdrawn?: boolean;
}

interface EarningsData {
  totalEarnings: string;
  withdrawableEarnings: string;
  paymentCount: number;
  recentPayments: Payment[];
  isWithdrawing: boolean;
  withdrawTxHash: string | null;
  withdraw: (ownerAddress: string) => Promise<void>;
}

export function useAgentEarnings(agentId: number): EarningsData {
  const [totalEarnings, setTotalEarnings] = useState('0.0000');
  const [withdrawableEarnings, setWithdrawableEarnings] = useState('0.0000');
  const [paymentCount, setPaymentCount] = useState(0);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await fetch(`${X402_SERVER_URL}/api/agents/${agentId}/earnings`);
      if (!res.ok) return;
      const json = await res.json();
      setTotalEarnings(json.totalEarnings || '0.0000');
      setWithdrawableEarnings(json.withdrawableEarnings || '0.0000');
      setPaymentCount(json.paymentCount || 0);
      setRecentPayments(json.recentPayments || []);
    } catch {
      // Silently fail — earnings are supplementary
    }
  }, [agentId]);

  const withdraw = useCallback(async (ownerAddress: string) => {
    setIsWithdrawing(true);
    setWithdrawTxHash(null);
    try {
      const res = await fetch(`${X402_SERVER_URL}/api/agents/${agentId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Withdrawal failed');
      }
      const data = await res.json();
      setWithdrawTxHash(data.txHash);
      // Refresh earnings after withdrawal
      await fetchEarnings();
    } finally {
      setIsWithdrawing(false);
    }
  }, [agentId, fetchEarnings]);

  useEffect(() => {
    fetchEarnings();
    const interval = setInterval(fetchEarnings, 15_000);
    return () => clearInterval(interval);
  }, [fetchEarnings]);

  return {
    totalEarnings,
    withdrawableEarnings,
    paymentCount,
    recentPayments,
    isWithdrawing,
    withdrawTxHash,
    withdraw,
  };
}
