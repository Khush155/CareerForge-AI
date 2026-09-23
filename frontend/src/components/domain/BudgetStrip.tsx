import React from 'react';
import type { PriorityLevel } from '../../lib/schemas';
import { formatHours, formatWeeks } from '../../lib/format';
import { Clock, PieChart, Sparkles } from 'lucide-react';

export interface BudgetSegment {
  skill: string;
  hours: number;
  priority: PriorityLevel;
}

export interface BudgetStripProps {
  segments: BudgetSegment[];
  totalHours: number;
  weeklyHours: number;
  onHoverSegment?: (skill: string | null) => void;
}

const PALETTE = [
  '#6366F1', // Indigo
  '#0EA5E9', // Sky
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export const BudgetStrip: React.FC<BudgetStripProps> = ({
  segments,
  totalHours,
  weeklyHours,
  onHoverSegment,
}) => {
  const estimatedWeeks = weeklyHours > 0 ? Math.ceil(totalHours / weeklyHours) : 0;

  return (
    <div className="rounded-3xl p-5 sm:p-6 flex flex-col gap-3.5 bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-[var(--shadow-card)]">
      <div className="flex justify-between items-center text-xs font-mono flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-[var(--text)] font-display tracking-tight">
            Curriculum Bandwidth Allocation
          </span>
        </div>
        <span className="text-[var(--text-muted)] flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--text)] font-semibold">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-indigo)]" />
            <span>{formatHours(totalHours)} total</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--accent-sky)]/10 border border-[var(--accent-sky)]/25 text-[var(--accent-sky)] font-semibold">
            <Sparkles className="w-3 h-3 text-[var(--accent-amber)]" />
            <span>{formatWeeks(estimatedWeeks)} @ {weeklyHours}h/wk</span>
          </span>
        </span>
      </div>

      <div className="w-full h-7 bg-[var(--bg-sunken)] rounded-full border border-[var(--border-subtle)] flex overflow-hidden shadow-inner relative">
        {segments.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
            Synthesize a roadmap to budget bandwidth across phases
          </div>
        ) : (
          segments.map((seg, idx) => {
            const pct = totalHours > 0 ? (seg.hours / totalHours) * 100 : 0;
            if (pct <= 0) return null;

            const color = PALETTE[idx % PALETTE.length];

            return (
              <div
                key={seg.skill}
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
                className="h-full flex items-center justify-center font-mono text-[11px] font-semibold text-white px-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer transition-all hover:opacity-90 hover:brightness-110 relative group"
                title={`${seg.skill}: ${seg.hours} hrs (${pct.toFixed(1)}%)`}
                onMouseEnter={() => onHoverSegment?.(seg.skill)}
                onMouseLeave={() => onHoverSegment?.(null)}
              >
                {pct >= 7 && (
                  <span className="truncate drop-shadow-sm font-semibold">
                    {seg.skill} {pct.toFixed(0)}%
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legend Chips */}
      {segments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px] font-mono">
          {segments.map((seg, idx) => {
            const color = PALETTE[idx % PALETTE.length];
            return (
              <div
                key={seg.skill}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border)] cursor-pointer hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                onMouseEnter={() => onHoverSegment?.(seg.skill)}
                onMouseLeave={() => onHoverSegment?.(null)}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate max-w-[140px]">{seg.skill}</span>
                <span className="text-[var(--text-faint)]">({seg.hours}h)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

