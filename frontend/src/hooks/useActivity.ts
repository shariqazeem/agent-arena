'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActivityRecord } from '@/types/agent';
import { X402_SERVER_URL } from '@/lib/constants';

interface ActivityStats {
  totalTransactions: number;
  totalUSDC: string;
  activeAgents: number;
  lastActivity: number | null;
}

export function useActivity() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalTransactions: 0,
    totalUSDC: '0.00',
    activeAgents: 0,
    lastActivity: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      const [actRes, statsRes] = await Promise.all([
        fetch(`${X402_SERVER_URL}/api/activity`),
        fetch(`${X402_SERVER_URL}/api/activity/stats`),
      ]);
      if (actRes.ok) {
        const data = await actRes.json();
        setActivities(data.activities);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch {
      // Server might not be running yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 10_000);

    // WebSocket for real-time updates
    try {
      const wsUrl = X402_SERVER_URL.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}/ws`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'activity') {
          setActivities((prev) => [msg.data, ...prev].slice(0, 50));
          fetchActivity(); // Refresh stats
        }
      };

      ws.onerror = () => {};
    } catch {
      // WS not available
    }

    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, [fetchActivity]);

  return { activities, stats, isLoading, refetch: fetchActivity };
}
