'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'yes' | 'no' | 'accent';
}

export default function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-background-secondary text-foreground-secondary',
    yes: 'bg-yes/10 text-yes',
    no: 'bg-no/10 text-no',
    accent: 'bg-accent/8 text-accent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
