'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { publicActions } from 'viem';
import { wrapFetchWithPayment } from 'x402-fetch';
import { X402_SERVER_URL } from '@/lib/constants';

export function useHireAgent() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hireAgent = useCallback(async (endpoint: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Extract agent ID for fallback
    const match = endpoint.match(/\/api\/agents\/(\d+)\//);
    const agentId = match?.[1];

    try {
      if (!isConnected) {
        setError('Please connect your wallet first');
        return null;
      }

      // Try x402 payment flow if wallet client is available
      if (walletClient) {
        try {
          const signer = walletClient.extend(publicActions);
          const fetchWithPay = wrapFetchWithPayment(
            fetch,
            signer as Parameters<typeof wrapFetchWithPayment>[1],
            BigInt(100_000), // max 0.10 USDC
          );

          const res = await fetchWithPay(`${X402_SERVER_URL}${endpoint}`);

          if (res.ok) {
            const data = await res.json();
            setResult(data);
            return data;
          }

          // Log the full 402 rejection for debugging
          const errorBody = await res.json().catch(() => null);
          console.warn('x402 payment rejected:', res.status, errorBody);
        } catch (x402Error) {
          console.warn('x402 payment error:', x402Error);
        }
      }

      // Fallback: demo hire endpoint
      if (!agentId) {
        setError('Invalid agent endpoint');
        return null;
      }

      const res = await fetch(`${X402_SERVER_URL}/api/hire/${agentId}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(body.error || `Agent call failed: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to call agent';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, walletClient]);

  return { hireAgent, result, isLoading, error };
}
