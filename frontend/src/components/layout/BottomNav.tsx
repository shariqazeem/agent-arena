'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/agents', label: 'Agents' },
  { href: '/deploy', label: 'Deploy' },
  { href: '/my-agents', label: 'My Agents' },
  { href: '/activity', label: 'Activity' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-header border-t border-border">
      <div className="flex items-center justify-around h-12 px-4">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1 rounded-full text-[13px] transition-all duration-300',
                isActive
                  ? 'text-foreground font-medium'
                  : 'text-foreground-tertiary'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
