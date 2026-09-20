import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface ReadinessRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const ReadinessRing: React.FC<ReadinessRingProps> = ({
  score,
  size = 148,
  strokeWidth = 11,
  label = 'Readiness Index',
  sublabel = 'Placement Benchmark',
}) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Smooth animated count-up effect
  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, Math.round(score)));
    if (end === 0) {
      setDisplayScore(0);
      return;
    }
    const duration = 1200;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + (end - start) * ease));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const anim = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(anim);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Status badge determined by readiness
  const getStatus = (s: number) => {
    if (s >= 80) return { text: 'Placement Ready', color: 'var(--accent-mint)', bg: 'rgba(16, 185, 129, 0.12)' };
    if (s >= 55) return { text: 'Accelerating', color: 'var(--accent-sky)', bg: 'rgba(56, 189, 248, 0.12)' };
    if (s >= 30) return { text: 'Building Core', color: 'var(--accent-indigo)', bg: 'rgba(99, 102, 241, 0.12)' };
    return { text: 'Early Stage', color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.12)' };
  };

  const status = getStatus(score);

  return (
    <div className="relative flex flex-col items-center justify-center p-5 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
          {label}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold"
          style={{ color: status.color, backgroundColor: status.bg }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          {status.text}
        </span>
      </div>

      {/* SVG Ring Container */}
      <div className="relative flex items-center justify-center my-1" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-indigo)" />
              <stop offset="50%" stopColor="var(--accent-sky)" />
              <stop offset="100%" stopColor="var(--accent-mint)" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--bg-elev-3)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#readinessGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-3xl font-extrabold font-display text-[var(--text)] tracking-tight">
            {displayScore}%
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase mt-0.5">
            Fulfillment
          </span>
        </div>
      </div>

      {/* Bottom Subtitle / Info */}
      <div className="mt-3 text-center">
        <p className="text-xs text-[var(--text-muted)] font-body">
          {sublabel}
        </p>
      </div>
    </div>
  );
};
