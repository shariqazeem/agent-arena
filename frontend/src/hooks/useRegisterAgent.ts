'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AGENT_REGISTRY_ABI } from '@/lib/contract-abi';
import { AGENT_REGISTRY_ADDRESS } from '@/lib/constants';

export function useRegisterAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function registerAgent(
    name: string,
    description: string,
    serviceType: number,
    endpoint: string,
    pricePerQuery: bigint
  ) {
    writeContract({
      address: AGENT_REGISTRY_ADDRESS,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'registerAgent',
      args: [name, description, serviceType, endpoint, pricePerQuery],
    });
  }

  return {
    registerAgent,
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
