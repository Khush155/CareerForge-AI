import React from 'react';
import type { PriorityLevel } from '../../lib/schemas';
import { formatHours, formatWeeks } from '../../lib/format';
import { Clock, PieChart } from 'lucide-react';

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

const CYBER_PALETTE = ['#00F2FE', '#6366F1', '#A855F7', '#10B981', '#F59E0B', '#EC4899', '#38BDF8'];

export const BudgetStrip: React.FC<BudgetStripProps> = ({
  segments,
  totalHours,
  weeklyHours,
  onHoverSegment,
}) => {
  const estimatedWeeks = weeklyHours > 0 ? Math.ceil(totalHours / weeklyHours) : 0;

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col gap-3 shadow-md border border-[var(--border-default)]">
      <div className="flex justify-between items-center text-xs font-mono flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[var(--neon-cyan)]" />
          <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">
            Bandwidth Allocation Engine
          </span>
        </div>
        <span className="text-[var(--text-muted)] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[var(--neon-indigo)]" />
          <span className="text-[var(--text-primary)] font-bold">{formatHours(totalHours)}</span> total ·{' '}
          <span className="text-[var(--neon-cyan)] font-semibold">{formatWeeks(estimatedWeeks)}</span> at {weeklyHours} h/wk
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

            const color = CYBER_PALETTE[idx % CYBER_PALETTE.length];

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
                {pct >= 8 && (
                  <span className="truncate drop-shadow-sm">
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
        <div className="flex items-center gap-3 flex-wrap pt-1 text-[11px] font-mono">
          {segments.map((seg, idx) => (
            <div
              key={seg.skill}
              className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--text-primary)] text-[var(--text-secondary)] transition-colors"
              onMouseEnter={() => onHoverSegment?.(seg.skill)}
              onMouseLeave={() => onHoverSegment?.(null)}
            >
              <span
                className="w-2 h-2 rounded-full shadow-sm"
                style={{ backgroundColor: CYBER_PALETTE[idx % CYBER_PALETTE.length] }}
              />
              <span>{seg.skill}: {seg.hours}h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
