'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { SERVICE_TYPES } from '@/lib/constants';
import { ServiceType } from '@/types/agent';
import Button from '@/components/ui/Button';
import { useRegisterAgent } from '@/hooks/useRegisterAgent';
import { useToast } from '@/components/ui/Toast';

export default function DeployAgentForm() {
  const { isConnected } = useAccount();
  const { registerAgent, isPending, isConfirming, isSuccess, txHash, error } = useRegisterAgent();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DataAnalysis);
  const [endpoint, setEndpoint] = useState('');
  const [price, setPrice] = useState('0.01');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !endpoint) {
      addToast('Please fill all fields', 'error');
      return;
    }
    const priceInMicroUSDC = BigInt(Math.round(parseFloat(price) * 1_000_000));
    registerAgent(name, description, serviceType, endpoint, priceInMicroUSDC);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="max-w-[520px] mx-auto premium-card p-10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 }}
          className="w-16 h-16 rounded-full bg-yes/10 flex items-center justify-center mx-auto mb-5"
        >
          <span className="text-[32px]">✓</span>
        </motion.div>
        <h2 className="text-[24px] font-semibold text-foreground tracking-tight mb-2">Agent Deployed</h2>
        <p className="text-[15px] text-foreground-secondary leading-relaxed mb-6">
          Your agent NFT has been minted on Avalanche Fuji.
        </p>
        {txHash && (
          <a
            href={`https://testnet.snowscan.xyz/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-accent text-[14px] font-medium hover:underline"
          >
            View on Snowscan
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </motion.div>
    );
  }

  const inputClass = 'w-full bg-background-secondary border-0 rounded-2xl px-5 py-3.5 text-[15px] text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200';

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="max-w-[520px] mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="premium-card p-8 space-y-6">
        <div>
          <label className="block text-[12px] font-medium text-foreground-tertiary uppercase tracking-wider mb-2">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MyDataBot"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-foreground-tertiary uppercase tracking-wider mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does your agent do?"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-foreground-tertiary uppercase tracking-wider mb-2">Service Type</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(Number(e.target.value) as ServiceType)}
            className={inputClass}
          >
            {Object.entries(SERVICE_TYPES).map(([key, info]) => (
              <option key={key} value={key}>{info.icon} {info.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-foreground-tertiary uppercase tracking-wider mb-2">Service Endpoint</label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://your-server.com/api/agent"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-foreground-tertiary uppercase tracking-wider mb-2">Price per Query (USDC)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="bg-no/5 rounded-2xl px-5 py-3.5">
            <p className="text-no text-[14px]">{error.message || 'Transaction failed'}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isPending || isConfirming}
          disabled={!isConnected}
        >
          {!isConnected
            ? 'Connect Wallet First'
            : isPending
            ? 'Confirm in Wallet...'
            : isConfirming
            ? 'Deploying...'
            : 'Deploy Agent'}
        </Button>
      </div>
    </motion.form>
  );
}
