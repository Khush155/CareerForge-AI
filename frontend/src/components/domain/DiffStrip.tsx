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
  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-panel rounded-3xl p-5 border border-[var(--neon-emerald)]/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Top Laser Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--neon-emerald)] to-[var(--neon-cyan)]" />

      <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--neon-emerald)]/10 border border-[var(--neon-emerald)]/30 flex items-center justify-center text-[var(--neon-emerald)]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            <span>Dynamic Recalibration Applied:</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30">
              Revision v{fromVersion} <ArrowRight className="w-3 h-3 inline" /> v{toVersion}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[var(--neon-emerald)] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Plan Restructured Live
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-6 h-6 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Dismiss diff summary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Delta Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <tbody>
            <tr className="border-b border-[var(--border-subtle)] py-2">
              <td className="py-2.5 font-sans font-bold text-sm text-[var(--text-primary)] w-40">
                {result.skill}
              </td>
              <td className="py-2.5 text-[var(--text-muted)]">
                Proficiency: {formatLevel(result.previous_level)}
              </td>
              <td className="py-2.5 text-[var(--neon-cyan)] px-2">
                <ArrowRight className="w-3 h-3 inline" />
              </td>
              <td className="py-2.5 font-bold text-[var(--text-primary)]">
                {formatLevel(result.updated_level)}
              </td>
              <td className="py-2.5 text-right font-bold text-[var(--neon-emerald)]">
                <span className="px-2 py-0.5 rounded-full bg-[var(--neon-emerald)]/15 border border-[var(--neon-emerald)]/30">
                  +{formatLevel(result.level_delta)} pts gained
                </span>
              </td>
              <td className="py-2.5 text-right text-[var(--text-secondary)]">
                <span className="text-[11px] text-[var(--neon-cyan)] font-semibold">
                  Remaining hours reduced & deprioritized
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Narrative Synthesis */}
      <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-sunken)] p-3 rounded-2xl border border-[var(--border-subtle)] leading-relaxed flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-[var(--neon-cyan)] shrink-0 mt-0.5" />
        <span>{summary}</span>
      </div>
    </div>
  );
};
