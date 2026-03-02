'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Agent } from '@/types/agent';
import { X402_SERVER_URL } from '@/lib/constants';

export function useAgent(id: number) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`${X402_SERVER_URL}/api/agents/${id}`);
      if (!res.ok) throw new Error('Agent not found');
      const data = await res.json();
      setAgent(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  return { agent, isLoading, error, refetch: fetchAgent };
}
