import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Sparkles, Activity, ShieldCheck, Database, Sliders, RefreshCw } from 'lucide-react';

interface StepNode {
  id: number;
  label: string;
  tag: string;
  desc: string;
  icon: React.ReactNode;
  angle: number;
  color: string;
}

const STEPS: StepNode[] = [
  { id: 1, label: 'Research', tag: 'Live Benchmarks', desc: 'Queries verified industry skill standards', icon: <Database className="w-3.5 h-3.5" />, angle: 0, color: '#00F2FE' },
  { id: 2, label: 'Analyze', tag: 'Proficiency Scan', desc: 'Parses student background & self-ratings', icon: <Activity className="w-3.5 h-3.5" />, angle: 51.4, color: '#38BDF8' },
  { id: 3, label: 'Compare', tag: 'Pure Math Gaps', desc: 'Deterministic gap = max(0, req - curr)', icon: <Cpu className="w-3.5 h-3.5" />, angle: 102.8, color: '#6366F1' },
  { id: 4, label: 'Recommend', tag: 'Curated RAG', desc: 'Retrieves local offline study guides & docs', icon: <Sparkles className="w-3.5 h-3.5" />, angle: 154.2, color: '#A855F7' },
  { id: 5, label: 'Budget', tag: 'Phased Allocator', desc: 'Packs weekly hours across optimal phases', icon: <Sliders className="w-3.5 h-3.5" />, angle: 205.6, color: '#EC4899' },
  { id: 6, label: 'Assess', tag: 'Score Diagnostic', desc: 'Validates real skill mastery via quizzes', icon: <ShieldCheck className="w-3.5 h-3.5" />, angle: 257.0, color: '#10B981' },
  { id: 7, label: 'Adapt', tag: 'Dynamic Recalibration', desc: 'Recalculates subsequent phases instantly', icon: <RefreshCw className="w-3.5 h-3.5" />, angle: 308.4, color: '#F59E0B' },
];

export const HeroOrbitalCore: React.FC = () => {
  const [activeStep, setActiveStep] = useState<StepNode | null>(null);

  return (
    <div className="relative w-full h-[280px] max-w-[420px] mx-auto flex items-center justify-center select-none">
      {/* Background Ambient Glow */}
      <div
        className="absolute w-52 h-52 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--neon-cyan) 0%, var(--neon-violet) 70%, transparent 100%)',
        }}
      />

      {/* SVG 3D Concentric Orbitals */}
      <svg
        className="w-full h-full overflow-visible pointer-events-none"
        viewBox="0 0 400 280"
        fill="none"
      >
        <defs>
          <linearGradient id="orbital-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--neon-indigo)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--neon-violet)" stopOpacity="0.8" />
          </linearGradient>
          <filter id="core-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Elliptical Orbital Track */}
        <ellipse
          cx="200"
          cy="140"
          rx="170"
          ry="90"
          stroke="url(#orbital-gradient-1)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          className="opacity-45"
        />

        {/* Middle Track */}
        <ellipse
          cx="200"
          cy="140"
          rx="115"
          ry="60"
          stroke="var(--neon-indigo)"
          strokeWidth="1"
          className="opacity-30"
        />

        {/* Inner Laser Track */}
        <ellipse
          cx="200"
          cy="140"
          rx="65"
          ry="35"
          stroke="var(--neon-cyan)"
          strokeWidth="1.5"
          className="opacity-50"
        />
      </svg>

      {/* Center Core Reactor Unit */}
      <motion.div
        animate={{
          scale: [1, 1.06, 1],
          boxShadow: [
            '0 0 20px rgba(0, 242, 254, 0.3)',
            '0 0 35px rgba(168, 85, 247, 0.5)',
            '0 0 20px rgba(0, 242, 254, 0.3)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute z-10 w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--neon-cyan)]/40 flex flex-col items-center justify-center cursor-pointer shadow-lg backdrop-blur-md"
        onMouseEnter={() =>
          setActiveStep({
            id: 0,
            label: 'CareerForge Core',
            tag: 'Deterministic AI Engine',
            desc: '7-stage closed placement preparation feedback loop with 0% AI math drift.',
            icon: <Cpu className="w-4 h-4" />,
            angle: 0,
            color: '#00F2FE',
          })
        }
        onMouseLeave={() => setActiveStep(null)}
      >
        <div className="relative">
          <Cpu className="w-7 h-7 text-[var(--neon-cyan)] animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--neon-emerald)] animate-ping" />
        </div>
        <span className="font-mono text-[9px] text-[var(--text-muted)] font-semibold mt-1 tracking-wider uppercase">
          7-LOOP
        </span>
      </motion.div>

      {/* Orbiting Satellite Nodes */}
      {STEPS.map((step) => {
        // Calculate point on 2D perspective ellipse: rx=170, ry=90
        const rad = (step.angle * Math.PI) / 180;
        const x = 200 + 170 * Math.cos(rad);
        const y = 140 + 90 * Math.sin(rad);

        const isHovered = activeStep?.id === step.id;

        return (
          <motion.div
            key={step.id}
            style={{
              left: `${(x / 400) * 100}%`,
              top: `${(y / 280) * 100}%`,
            }}
            whileHover={{ scale: 1.25 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
            onMouseEnter={() => setActiveStep(step)}
            onMouseLeave={() => setActiveStep(null)}
          >
            <div
              style={{ borderColor: step.color }}
              className={`w-7 h-7 rounded-full bg-[var(--bg-surface)] border-2 flex items-center justify-center transition-all duration-300 shadow-md ${
                isHovered ? 'scale-125 shadow-[0_0_16px_var(--neon-cyan)]' : 'hover:scale-110'
              }`}
            >
              <span style={{ color: step.color }}>{step.icon}</span>
            </div>
            <span
              style={{ color: isHovered ? step.color : 'var(--text-muted)' }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 font-mono text-[10px] font-semibold tracking-wider whitespace-nowrap"
            >
              {step.label}
            </span>
          </motion.div>
        );
      })}

      {/* Active Stage Cyber Tooltip Readout */}
      {activeStep && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-2 z-30 max-w-[280px] bg-[var(--bg-raised)] border border-[var(--border-strong)] rounded-2xl px-3.5 py-2.5 text-center shadow-xl backdrop-blur-lg"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
            <span style={{ color: activeStep.color }}>{activeStep.icon}</span>
            <span>{activeStep.label}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-sunken)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              {activeStep.tag}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug">
            {activeStep.desc}
          </p>
        </motion.div>
      )}
    </div>
  );
};
