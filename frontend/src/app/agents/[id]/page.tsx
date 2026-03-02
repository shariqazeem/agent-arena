'use client';

import { use } from 'react';
import { useAgent } from '@/hooks/useAgent';
import AgentProfile from '@/components/agents/AgentProfile';
import Skeleton from '@/components/ui/Skeleton';

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { agent, isLoading, error } = useAgent(parseInt(id));

  if (isLoading) {
    return (
      <div className="max-w-[640px] mx-auto px-6 pt-16 pb-32 space-y-5">
        <Skeleton className="h-52" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-[640px] mx-auto px-6 pt-16 pb-32 text-center">
        <p className="text-[15px] text-foreground-secondary">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="px-6 pt-16 pb-32">
      <AgentProfile agent={agent} />
    </div>
  );
}
