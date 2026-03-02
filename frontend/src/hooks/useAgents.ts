'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Agent } from '@/types/agent';
import { X402_SERVER_URL } from '@/lib/constants';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${X402_SERVER_URL}/api/agents`);
      if (!res.ok) throw new Error('Failed to fetch agents');
      const data = await res.json();
      setAgents(data.agents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15_000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  return { agents, isLoading, error, refetch: fetchAgents };
}
