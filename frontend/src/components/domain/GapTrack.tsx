import React, { useRef } from 'react';
import type { PriorityLevel } from '../../lib/schemas';
import { cn } from '../../lib/cn';

export interface GapTrackProps {
  current: number;
  required: number;
  previous?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  priority?: PriorityLevel;
  showTick?: boolean;
  label?: string;
  animate?: boolean;
  interactive?: boolean;
  onChange?: (val: number) => void;
  className?: string;
}

export const GapTrack: React.FC<GapTrackProps> = ({
  current,
  required,
  previous,
  max = 5.0,
  size = 'md',
  priority = 'Low',
  showTick = true,
  label = 'Skill progress',
  animate = true,
  interactive = false,
  onChange,
  className,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const currentPct = Math.min(100, Math.max(0, (current / max) * 100));
  const reqPct = Math.min(100, Math.max(0, (required / max) * 100));
  const prevPct = previous !== undefined ? Math.min(100, Math.max(0, (previous / max) * 100)) : null;

  const sizeClasses = {
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !onChange || !trackRef.current) return;
    const update = (clientX: number) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const raw = ((clientX - rect.left) / rect.width) * max;
      const clamped = Math.max(0, Math.min(max, Math.round(raw * 10) / 10));
      onChange(clamped);
    };

    update(e.clientX);
    const onMove = (moveEv: PointerEvent) => update(moveEv.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onChange) return;
    const step = e.shiftKey ? 0.5 : 0.1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(0, Math.round((current - step) * 10) / 10));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(max, Math.round((current + step) * 10) / 10));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  };

  return (
    <div
      ref={trackRef}
      role={interactive ? 'slider' : 'progressbar'}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-valuetext={`${current.toFixed(1)} out of ${max.toFixed(1)}, benchmark ${required.toFixed(1)}, gap ${(Math.max(0, required - current)).toFixed(1)}`}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative w-full bg-[var(--bg-sunken)] border border-[var(--border-subtle)] rounded-full select-none overflow-hidden flex items-center shadow-inner group',
        sizeClasses[size],
        interactive && 'cursor-ew-resize focus-visible:outline-2 focus-visible:outline-[var(--neon-cyan)]',
        className
      )}
    >
      {/* Ghost marker if previous value is present (for adaptation diff contexts) */}
      {prevPct !== null && (
        <div
          className="absolute top-0 bottom-0 bg-[var(--accent)] opacity-25 border-r border-dashed border-[var(--accent)]"
          style={{ width: `${prevPct}%` }}
        />
      )}

      {/* Current proficiency bar with holographic cyber gradient */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 rounded-full flex items-center overflow-hidden',
          animate ? 'transition-[width] duration-500 ease-[var(--ease-standard)]' : ''
        )}
        style={{
          width: `${currentPct}%`,
          background: 'linear-gradient(90deg, #3B82F6 0%, #6366F1 60%, #00F2FE 100%)',
          boxShadow: '0 0 12px rgba(0, 242, 254, 0.35)',
        }}
      >
        {/* Animated subtle shimmer light streak */}
        <div
          className="absolute inset-0 opacity-35 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
            animation: 'shimmer-sweep 2.5s infinite ease-in-out',
          }}
        />
      </div>

      {/* Gap fill segment with hatch pattern if required > current */}
      {reqPct > currentPct && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: `${currentPct}%`,
            width: `${reqPct - currentPct}%`,
            backgroundImage: 'var(--hatch-pattern)',
            opacity: priority === 'High' ? 0.45 : priority === 'Medium' ? 0.35 : 0.2,
          }}
          title={`${priority} priority gap: ${(Math.max(0, required - current)).toFixed(1)} pts`}
        />
      )}

      {/* Benchmark tick mark: Neon laser line with indicator badge */}
      {showTick && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)] z-10 pointer-events-none"
          style={{ left: `${reqPct}%` }}
          title={`Market benchmark: ${required.toFixed(1)}`}
        >
          {size !== 'sm' && (
            <span className="absolute -top-4 -translate-x-1/2 font-mono text-[9px] font-semibold text-[var(--neon-cyan)] bg-[var(--bg-sunken)] px-1 py-0.2 rounded border border-[var(--neon-cyan)]/30 whitespace-nowrap shadow-sm">
              {required.toFixed(1)} req
            </span>
          )}
        </div>
      )}

      {/* Interactive Cyber Handle */}
      {interactive && (
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[var(--neon-cyan)] rounded-full shadow-[0_0_10px_var(--neon-cyan)] z-20 pointer-events-none group-hover:scale-125 transition-transform"
          style={{ left: `${currentPct}%` }}
        />
      )}
    </div>
  );
};
