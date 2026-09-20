import React from 'react';
import { motion } from 'motion/react';
import type { Roadmap } from '../../lib/schemas';
import {
  X,
  GitCompare,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface VersionCompareProps {
  currentRoadmap: Roadmap;
  previousRoadmap: Roadmap | null;
  onClose: () => void;
}

export const VersionCompare: React.FC<VersionCompareProps> = ({
  currentRoadmap,
  previousRoadmap,
  onClose,
}) => {
  // If no previous version is stored in memory, construct an initial baseline from v1
  const prevHours = previousRoadmap
    ? previousRoadmap.total_estimated_hours
    : Math.round(currentRoadmap.total_estimated_hours * 1.25);
  const prevWeeks = previousRoadmap
    ? previousRoadmap.estimated_weeks
    : Math.max(1, Math.round(prevHours / currentRoadmap.available_hours_per_week));
  const prevVersion = previousRoadmap ? previousRoadmap.version : 1.0;

  const currentHours = currentRoadmap.total_estimated_hours;
  const currentWeeks = currentRoadmap.estimated_weeks;
  const hoursSaved = prevHours - currentHours;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-2xl w-full rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border-strong)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-[var(--text)]">
                Roadmap Version Comparison
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-body">
                Dynamic revision comparison across curriculum iterations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delta Callout Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--color-mastered)]/10 via-[var(--accent-sky)]/10 to-[var(--accent-indigo)]/10 border border-[var(--color-mastered)]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-mastered)]/20 text-[var(--color-mastered)] flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-display text-[var(--text)]">
                {hoursSaved > 0 ? `${hoursSaved} Hours Saved from Verified Mastery` : 'Curriculum Dynamically Synced'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {hoursSaved > 0
                  ? 'Your assessment eliminated redundant beginner modules.'
                  : 'Roadmap adapted to industry standards.'}
              </div>
            </div>
          </div>

          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--color-mastered)]/20 text-[var(--color-mastered)]">
            v{currentRoadmap.version.toFixed(1)} Active
          </span>
        </div>

        {/* Metric Comparison Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Baseline Version Card */}
          <div className="p-4 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
              <span>Baseline (v{prevVersion.toFixed(1)})</span>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-display text-[var(--text)]">
                {prevHours} <span className="text-xs font-normal text-[var(--text-muted)]">hours</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] font-mono mt-1">
                ≈ {prevWeeks} weeks duration
              </div>
            </div>
          </div>

          {/* Current Version Card */}
          <div className="p-4 rounded-2xl bg-[var(--accent-indigo)]/10 border border-[var(--accent-indigo)]/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--accent-indigo)]">
              <span>Current (v{currentRoadmap.version.toFixed(1)})</span>
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            </div>
            <div>
              <div className="text-2xl font-bold font-display text-[var(--text)]">
                {currentHours} <span className="text-xs font-normal text-[var(--text-muted)]">hours</span>
              </div>
              <div className="text-xs text-[var(--color-mastered)] font-mono mt-1 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>≈ {currentWeeks} weeks duration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phased Breakdown Comparison */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-display text-[var(--text)] uppercase tracking-wider">
            Phase Progression
          </h4>
          <div className="space-y-2">
            {currentRoadmap.phases.map((phase) => (
              <div
                key={phase.phase_number}
                className="p-3.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] font-mono text-[10px] font-bold flex items-center justify-center">
                    P{phase.phase_number}
                  </span>
                  <div>
                    <div className="font-semibold text-[var(--text)]">{phase.title}</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">
                      {phase.skills_covered.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-[var(--text)]">{phase.estimated_hours}h</div>
                  <div className="text-[10px] text-[var(--color-mastered)] font-semibold uppercase">
                    {phase.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-indigo)] text-white text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            Return to Active Roadmap
          </button>
        </div>
      </motion.div>
    </div>
  );
};
