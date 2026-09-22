import React from 'react';
import type { AssessmentResult } from '../../lib/schemas';
import { formatLevel } from '../../lib/format';
import { RefreshCw, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';

export interface DiffStripProps {
  fromVersion: number;
  toVersion: number;
  result: AssessmentResult;
  summary: string;
  onDismiss?: () => void;
}

export const DiffStrip: React.FC<DiffStripProps> = ({
  fromVersion,
  toVersion,
  result,
  summary,
  onDismiss,
}) => {
  const isPositive = result.level_delta >= 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-panel rounded-3xl p-5 border border-[var(--accent-mint)]/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex flex-col gap-4 relative overflow-hidden bg-[var(--bg-elev-1)]"
    >
      {/* Top Laser Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-mint)] via-[var(--accent-sky)] to-[var(--accent-purple)]" />

      <div className="flex justify-between items-center pb-2 border-b border-[var(--border)] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 flex items-center justify-center text-[var(--accent-mint)]">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <span className="font-mono text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
            <span>Dynamic Recalibration Applied:</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent-sky)]/15 text-[var(--accent-sky)] border border-[var(--accent-sky)]/30 font-mono">
              Revision v{(Number(fromVersion) || 1).toFixed(1)} <ArrowRight className="w-3 h-3 inline" /> v{(Number(toVersion) || 2).toFixed(1)}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[var(--accent-mint)] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Plan Restructured Live
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)] flex items-center justify-center cursor-pointer transition-colors border border-transparent hover:border-[var(--border)]"
              aria-label="Dismiss diff summary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delta Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <tbody>
            <tr className="border-b border-[var(--border)] py-2">
              <td className="py-2.5 font-display font-bold text-sm text-[var(--text)] w-40">
                {result.skill}
              </td>
              <td className="py-2.5 text-[var(--text-muted)]">
                Proficiency: {formatLevel(result.previous_level)}
              </td>
              <td className="py-2.5 text-[var(--accent-sky)] px-2">
                <ArrowRight className="w-3 h-3 inline" />
              </td>
              <td className="py-2.5 font-bold text-[var(--text)]">
                {formatLevel(result.updated_level)} / 5.0
              </td>
              <td className="py-2.5 text-right font-bold text-[var(--accent-mint)]">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    isPositive
                      ? 'bg-[var(--accent-mint)]/15 text-[var(--accent-mint)] border-[var(--accent-mint)]/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isPositive ? `+${formatLevel(result.level_delta)} pts gained` : `${formatLevel(result.level_delta)} pts delta`}
                </span>
              </td>
              <td className="py-2.5 text-right text-[var(--text-muted)]">
                <span className="text-[11px] text-[var(--accent-sky)] font-semibold font-sans">
                  Remaining hours reduced & deprioritized
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Narrative Synthesis */}
      <div className="text-xs text-[var(--text)] bg-[var(--bg-elev-2)] p-3 rounded-2xl border border-[var(--border)] leading-relaxed flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-[var(--accent-sky)] shrink-0 mt-0.5" />
        <span className="font-sans">{summary}</span>
      </div>
    </div>
  );
};
