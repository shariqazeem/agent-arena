'use client';

import { motion } from 'framer-motion';
import MyAgentList from '@/components/agents/MyAgentList';

export default function MyAgentsPage() {
  return (
    <div className="max-w-[960px] mx-auto px-6 pt-16 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-center mb-12"
      >
        <h1 className="text-[40px] font-semibold tracking-tight text-foreground">My Agents</h1>
        <p className="text-[17px] text-foreground-secondary mt-2">
          Manage your deployed agents, track earnings, and withdraw funds.
        </p>
      </motion.div>
      <MyAgentList />
    </div>
  );
}
