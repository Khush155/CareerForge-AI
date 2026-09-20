import React from 'react';
import type { PriorityLevel } from '../../lib/schemas';
import { cn } from '../../lib/cn';

interface PriorityBadgeProps {
  level: PriorityLevel;
  withLabel?: boolean;
  className?: string;
}

const META: Record<PriorityLevel, { colorClass: string; bgClass: string; borderClass: string; glowClass: string; label: string; icon: string }> = {
  High: {
    colorClass: 'text-[var(--priority-high)]',
    bgClass: 'bg-[var(--priority-high)]/10',
    borderClass: 'border-[var(--priority-high)]/30',
    glowClass: 'shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    label: 'Critical Gap',
    icon: '⚡',
  },
  Medium: {
    colorClass: 'text-[var(--priority-medium)]',
    bgClass: 'bg-[var(--priority-medium)]/10',
    borderClass: 'border-[var(--priority-medium)]/30',
    glowClass: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    label: 'Target Gap',
    icon: '▲',
  },
  Low: {
    colorClass: 'text-[var(--priority-low)]',
    bgClass: 'bg-[var(--priority-low)]/10',
    borderClass: 'border-[var(--priority-low)]/30',
    glowClass: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    label: 'Minor Gap',
    icon: '●',
  },
  Mastered: {
    colorClass: 'text-[var(--priority-mastered)]',
    bgClass: 'bg-[var(--priority-mastered)]/10',
    borderClass: 'border-[var(--priority-mastered)]/20',
    glowClass: '',
    label: 'Mastered',
    icon: '✓',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  level,
  withLabel = true,
  className,
}) => {
  const meta = META[level] || META.Low;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono font-medium select-none transition-all',
        meta.colorClass,
        meta.bgClass,
        meta.borderClass,
        meta.glowClass,
        className
      )}
    >
      <span className="text-[10px] leading-none" aria-hidden="true">
        {meta.icon}
      </span>
      {withLabel && <span>{meta.label}</span>}
    </span>
  );
};
