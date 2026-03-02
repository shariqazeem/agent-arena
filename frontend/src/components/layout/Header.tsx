'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/agents', label: 'Agents' },
  { href: '/deploy', label: 'Deploy' },
  { href: '/activity', label: 'Activity' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-border">
      <div className="max-w-[1120px] mx-auto px-6 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-[15px] font-semibold text-foreground tracking-tight">
            Agent Arena
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1 rounded-full text-[13px] transition-all duration-300',
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
            const connected = mounted && account && chain;
            return (
              <div
                {...(!mounted && {
                  'aria-hidden': true,
                  style: { opacity: 0, pointerEvents: 'none' as const, userSelect: 'none' as const },
                })}
              >
                {!connected ? (
                  <button
                    onClick={openConnectModal}
                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover rounded-full text-white text-[13px] font-medium transition-all duration-200 active:scale-[0.97]"
                  >
                    Connect Wallet
                  </button>
                ) : chain?.unsupported ? (
                  <button
                    onClick={openChainModal}
                    className="px-4 py-1.5 bg-no/10 rounded-full text-no text-[13px] font-medium"
                  >
                    Wrong Network
                  </button>
                ) : (
                  <button
                    onClick={openAccountModal}
                    className="px-4 py-1.5 bg-background-secondary hover:bg-border rounded-full text-[13px] font-medium transition-all duration-200"
                  >
                    {account.displayName}
                  </button>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
