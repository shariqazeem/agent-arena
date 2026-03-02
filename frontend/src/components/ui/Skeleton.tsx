'use client';

import { cn } from '@/lib/utils';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl shimmer', className)} />
  );
}
