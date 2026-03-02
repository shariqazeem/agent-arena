'use client';

import { motion } from 'framer-motion';

const AGENTS = [
  { id: 0, name: 'DataBot', emoji: '📊', x: 15, y: 38, color: '#0071e3' },
  { id: 1, name: 'NewsBot', emoji: '📰', x: 85, y: 38, color: '#28cd41' },
  { id: 2, name: 'TraderBot', emoji: '📈', x: 50, y: 10, color: '#ff9500' },
  { id: 3, name: 'SentimentBot', emoji: '🧠', x: 50, y: 66, color: '#af52de' },
];

const CONNECTIONS = [
  { from: 2, to: 0, label: '$0.02' },
  { from: 2, to: 1, label: '$0.01' },
  { from: 2, to: 3 },
];

export default function AgentEconomyGraph() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="premium-card p-8"
    >
      <p className="text-[11px] font-semibold text-foreground-tertiary uppercase tracking-[0.08em] mb-6">Agent Economy</p>

      <div className="relative w-full" style={{ paddingBottom: '60%' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 70">
          {CONNECTIONS.map((conn, i) => {
            const from = AGENTS.find((a) => a.id === conn.from)!;
            const to = AGENTS.find((a) => a.id === conn.to)!;
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="#e5e5ea" strokeWidth="0.35"
                />
                <motion.circle
                  r="0.9"
                  fill={from.color}
                  initial={{ cx: from.x, cy: from.y, opacity: 0 }}
                  animate={{
                    cx: [from.x, to.x],
                    cy: [from.y, to.y],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 1,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: 'easeInOut',
                  }}
                />
                {conn.label && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 2.5}
                    textAnchor="middle"
                    fill="#aeaeb2"
                    style={{ fontSize: '2.5px', fontWeight: 500 }}
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {AGENTS.map((agent, i) => (
          <motion.div
            key={agent.id}
            className="absolute flex flex-col items-center"
            style={{ left: `${agent.x}%`, top: `${agent.y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 + i * 0.1 }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px]"
              style={{ backgroundColor: `${agent.color}0D`, boxShadow: 'var(--shadow-xs)' }}
            >
              {agent.emoji}
            </div>
            <span
              className="text-[10px] font-semibold mt-1.5 tracking-tight"
              style={{ color: agent.color }}
            >
              {agent.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
