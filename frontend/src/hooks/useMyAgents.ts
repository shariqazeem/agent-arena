'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { Agent } from '@/types/agent';
import { useAgents } from './useAgents';
import { X402_SERVER_URL } from '@/lib/constants';

export interface MyAgent extends Agent {
  earnings: {
    totalEarnings: string;
    withdrawableEarnings: string;
    paymentCount: number;
  };
}

export function useMyAgents() {
  const { address } = useAccount();
  const { agents, isLoading: agentsLoading } = useAgents();
  const [myAgents, setMyAgents] = useState<MyAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isWalletConnected = !!address;

  const ownedAgents = agents.filter(
    (a) => address && a.owner.toLowerCase() === address.toLowerCase(),
  );

  const fetchEarnings = useCallback(async () => {
    if (ownedAgents.length === 0) {
      setMyAgents([]);
      setIsLoading(false);
      return;
    }

    try {
      const earningsResults = await Promise.all(
        ownedAgents.map(async (agent) => {
          try {
            const res = await fetch(`${X402_SERVER_URL}/api/agents/${agent.id}/earnings`);
            if (!res.ok) return { totalEarnings: '0.0000', withdrawableEarnings: '0.0000', paymentCount: 0 };
            return await res.json();
          } catch {
            return { totalEarnings: '0.0000', withdrawableEarnings: '0.0000', paymentCount: 0 };
          }
        }),
      );

      setMyAgents(
        ownedAgents.map((agent, i) => ({
          ...agent,
          earnings: {
            totalEarnings: earningsResults[i].totalEarnings || '0.0000',
            withdrawableEarnings: earningsResults[i].withdrawableEarnings || '0.0000',
            paymentCount: earningsResults[i].paymentCount || 0,
          },
        })),
      );
    } catch {
      setMyAgents(ownedAgents.map((a) => ({
        ...a,
        earnings: { totalEarnings: '0.0000', withdrawableEarnings: '0.0000', paymentCount: 0 },
      })));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, agents.length]);

  useEffect(() => {
    if (!agentsLoading) {
      fetchEarnings();
    }
  }, [agentsLoading, fetchEarnings]);

  // 15s polling interval
  useEffect(() => {
    if (agentsLoading || ownedAgents.length === 0) return;
    const interval = setInterval(fetchEarnings, 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentsLoading, fetchEarnings]);

  return { myAgents, isLoading: agentsLoading || isLoading, isWalletConnected, refetch: fetchEarnings };
}
