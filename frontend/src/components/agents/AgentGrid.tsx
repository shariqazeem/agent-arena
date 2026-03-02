'use client';

import { useState } from 'react';
import type { Agent } from '@/types/agent';
import { ServiceType } from '@/types/agent';
import { SERVICE_TYPES } from '@/lib/constants';
import AgentCard from './AgentCard';
import Skeleton from '@/components/ui/Skeleton';

export default function AgentGrid({ agents, isLoading }: { agents: Agent[]; isLoading: boolean }) {
  const [filter, setFilter] = useState<ServiceType | 'all'>('all');
  const [sort, setSort] = useState<'reputation' | 'price'>('reputation');

  const filtered = agents
    .filter((a) => filter === 'all' || a.serviceType === filter)
    .sort((a, b) => {
      if (sort === 'reputation') return b.reputation.compositeScore - a.reputation.compositeScore;
      return parseFloat(a.pricePerQuery) - parseFloat(b.pricePerQuery);
    });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56" />)}
      </div>
    );
  }

  const filterOptions = [
    { key: 'all' as const, label: 'All' },
    ...Object.entries(SERVICE_TYPES).map(([k, v]) => ({ key: Number(k) as ServiceType, label: v.label })),
  ];

  return (
    <div>
      <div className="flex items-center gap-6 mb-8 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          {filterOptions.map((opt) => (
            <button
              key={String(opt.key)}
              onClick={() => setFilter(opt.key)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] transition-all duration-200 shrink-0 ${
                filter === opt.key
                  ? 'bg-foreground text-white font-medium'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'reputation' | 'price')}
          className="ml-auto text-[13px] text-foreground-secondary bg-transparent border-0 cursor-pointer shrink-0"
        >
          <option value="reputation">By Reputation</option>
          <option value="price">By Price</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-foreground-tertiary py-20 text-[15px]">No agents found</p>
      )}
    </div>
  );
}
