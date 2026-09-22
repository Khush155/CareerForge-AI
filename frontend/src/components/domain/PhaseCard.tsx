import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  Clock,
  Calendar,
  Award,
  ListChecks,
  Check,
  CheckSquare,
  RotateCcw,
  Target,
  ExternalLink,
} from 'lucide-react';
import type { RoadmapPhase, SkillGap } from '../../lib/schemas';
import { formatHours, formatWeeks, formatResourceRef } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useAppStore } from '../../lib/store';

export interface PhaseCardProps {
  phase: RoadmapPhase;
  gaps: SkillGap[];
  weeklyHours?: number;
  highlightedSkill?: string | null;
  onOpenResource?: (title: string) => void;
  isChanged?: boolean;
}

const PRIORITY_THEME: Record<string, { border: string; glow: string; badge: string }> = {
  High: {
    border: 'var(--accent-coral)',
    glow: '0 0 20px rgba(244, 63, 94, 0.25)',
    badge: 'bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border-[var(--accent-coral)]/30',
  },
  Medium: {
    border: 'var(--accent-amber)',
    glow: '0 0 20px rgba(245, 158, 11, 0.25)',
    badge: 'bg-[var(--accent-amber)]/15 text-[var(--accent-amber)] border-[var(--accent-amber)]/30',
  },
  Low: {
    border: 'var(--accent-emerald)',
    glow: '0 0 20px rgba(16, 185, 129, 0.25)',
    badge: 'bg-[var(--accent-emerald)]/15 text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30',
  },
  Mastered: {
    border: 'var(--accent-indigo)',
    glow: 'none',
    badge: 'bg-[var(--accent-indigo)]/15 text-[var(--accent-indigo)] border-[var(--accent-indigo)]/30',
  },
};

export const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  gaps,
  weeklyHours = 20,
  highlightedSkill,
  onOpenResource,
  isChanged = false,
}) => {
  const { completedMilestones, toggleMilestone } = useAppStore();

  // Milestone counters
  const totalMilestones = phase.learning_objectives.length;
  const completedCount = phase.learning_objectives.reduce((acc, _, idx) => {
    const key = `${phase.phase_number}-${idx}`;
    return acc + (completedMilestones[key] ? 1 : 0);
  }, 0);

  const completionPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
  const isPhaseComplete = completedCount === totalMilestones && totalMilestones > 0;

  const estimatedWeeks = weeklyHours > 0 ? Math.max(1, Math.round(phase.estimated_hours / weeklyHours)) : 1;
  const estHoursPerMilestone =
    totalMilestones > 0 ? Math.max(1, Math.round(phase.estimated_hours / totalMilestones)) : phase.estimated_hours;

  // Determine dominant priority
  let dominantPriority = 'Low';
  const firstSkill = gaps.find((g) => phase.skills_covered.includes(g.skill));
  if (firstSkill) {
    dominantPriority = firstSkill.priority;
  }

  const theme = PRIORITY_THEME[dominantPriority] || PRIORITY_THEME.Low;

  const isHighlighted = highlightedSkill
    ? phase.skills_covered.some((s) => s.toLowerCase() === highlightedSkill.toLowerCase())
    : false;

  // Find index of first uncompleted milestone (Next Up)
  const firstUnfinishedIdx = phase.learning_objectives.findIndex(
    (_, idx) => !completedMilestones[`${phase.phase_number}-${idx}`]
  );

  // Toggle all milestones in this phase
  const handleToggleAll = () => {
    const allCompleted = phase.learning_objectives.every(
      (_, idx) => !!completedMilestones[`${phase.phase_number}-${idx}`]
    );
    phase.learning_objectives.forEach((_, idx) => {
      const isDone = !!completedMilestones[`${phase.phase_number}-${idx}`];
      if (allCompleted ? isDone : !isDone) {
        toggleMilestone(phase.phase_number, idx);
      }
    });
  };

  return (
    <motion.div
      layout="position"
      layoutId={`phase-${phase.phase_number}`}
      style={{
        boxShadow: isHighlighted ? theme.glow : undefined,
      }}
      className={cn(
        'bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden transition-all duration-300 shadow-sm',
        isHighlighted && 'ring-2 ring-[var(--accent-indigo)] scale-[1.005]',
        isChanged && 'ring-2 ring-[var(--accent-sky)] shadow-[0_0_25px_rgba(56,189,248,0.25)]',
        isPhaseComplete && 'border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/[0.02]'
      )}
    >
      {/* Top Header Information */}
      <div className="flex justify-between items-start flex-wrap gap-3 pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-2xl bg-[var(--accent-indigo)]/10 border border-[var(--accent-indigo)]/25 font-mono text-base font-bold text-[var(--accent-indigo)] flex items-center justify-center shadow-inner">
            0{phase.phase_number}
          </span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl font-bold text-[var(--text)] tracking-tight font-display">
                {phase.title}
              </h3>
              {isPhaseComplete && (
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-emerald)]/15 border border-[var(--accent-emerald)]/30 text-xs font-mono font-bold text-[var(--accent-emerald)] flex items-center gap-1.5 shadow-sm">
                  <Award className="w-3.5 h-3.5" />
                  <span>Phase Mastered</span>
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              Stage 0{phase.phase_number} of sequential career roadmap
            </p>
          </div>
        </div>

        {/* Phase Duration & Hours Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--text)] font-semibold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-indigo)]" />
            <span>{formatHours(phase.estimated_hours)} target</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--text-muted)] font-medium">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent-sky)]" />
            <span>{formatWeeks(estimatedWeeks)}</span>
          </span>
        </div>
      </div>

      {/* Target Domains in Scope */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-[var(--accent-indigo)]" />
          <span>Target Domains in Scope:</span>
        </span>
        {phase.skills_covered.map((skill) => (
          <span
            key={skill}
            className="bg-[var(--bg-elev-2)] border border-[var(--border)] hover:border-[var(--accent-indigo)] rounded-lg px-2.5 py-1 font-mono text-xs font-medium text-[var(--text)] transition-colors shadow-2xs"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* RE-ENGINEERED MILESTONES & DELIVERABLES BLOCK */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-elev-2)]/70 border border-[var(--border)] flex flex-col gap-5">
        {/* Milestones Header & Global Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/25 flex items-center justify-center shrink-0">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold font-display text-[var(--text)]">
                Milestones & Learning Deliverables
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-body">
                Click any milestone card or checkbox below to tick off your progress as you complete them
              </p>
            </div>
          </div>

          {/* Counter Badge & Quick Mark All Button */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="px-3 py-1 rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--text)]">
              {completedCount}/{totalMilestones} Completed ({completionPct}%)
            </span>
            <button
              type="button"
              onClick={handleToggleAll}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-elev-1)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-xs font-mono font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-all cursor-pointer flex items-center gap-1.5"
              title={isPhaseComplete ? 'Reset all milestones in this phase' : 'Mark all milestones as completed'}
            >
              {isPhaseComplete ? (
                <>
                  <RotateCcw className="w-3 h-3 text-[var(--accent-amber)]" />
                  <span>Reset All</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3 h-3 text-[var(--accent-emerald)]" />
                  <span>Mark All Done</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Milestone Completion Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-[var(--bg-elev-3)] rounded-full overflow-hidden border border-[var(--border-subtle)] p-0.5">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${completionPct}%`,
                background: isPhaseComplete
                  ? 'var(--accent-emerald)'
                  : 'linear-gradient(90deg, var(--accent-indigo), var(--accent-sky), var(--accent-emerald))',
              }}
            />
          </div>
        </div>

        {/* Phase Mastered Celebration Banner */}
        {isPhaseComplete && (
          <div className="p-3.5 rounded-xl bg-[var(--accent-emerald)]/10 border border-[var(--accent-emerald)]/30 flex items-center justify-between gap-3 text-xs font-body animate-in fade-in">
            <div className="flex items-center gap-2.5 text-[var(--accent-emerald)] font-semibold">
              <Award className="w-5 h-5 shrink-0" />
              <span>
                Phenomenal achievement! You have mastered and completed all deliverables for Phase 0{phase.phase_number}.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[var(--accent-emerald)] font-bold shrink-0">
              100% Verified
            </span>
          </div>
        )}

        {/* Interactive Milestone Cards Stack */}
        <div className="flex flex-col gap-2.5">
          {phase.learning_objectives.map((obj, i) => {
            const key = `${phase.phase_number}-${i}`;
            const isDone = !!completedMilestones[key];
            const isNextUp = !isDone && i === firstUnfinishedIdx;

            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => toggleMilestone(phase.phase_number, i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMilestone(phase.phase_number, i);
                  }
                }}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 select-none ${
                  isDone
                    ? 'bg-[var(--accent-emerald)]/[0.07] border-[var(--accent-emerald)]/30 hover:border-[var(--accent-emerald)]/60'
                    : isNextUp
                    ? 'bg-[var(--bg-elev-1)] border-[var(--accent-indigo)]/60 ring-2 ring-[var(--accent-indigo)]/20 shadow-md'
                    : 'bg-[var(--bg-elev-1)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]'
                }`}
              >
                {/* Tactile Animated Checkbox */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                    isDone
                      ? 'bg-[var(--accent-emerald)] shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-105'
                      : 'border-2 border-[var(--border-strong)] bg-[var(--bg-elev-2)] group-hover:border-[var(--accent-indigo)] group-hover:scale-105'
                  }`}
                  aria-label={isDone ? 'Completed milestone' : 'Unfinished milestone'}
                >
                  {isDone ? (
                    <Check
                      className="w-4 h-4 stroke-[3] text-black dark:text-white"
                      style={{ color: 'var(--milestone-tick-color)' }}
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[var(--accent-indigo)]/40 transition-colors" />
                  )}
                </div>

                {/* Milestone Details & Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          isDone
                            ? 'bg-[var(--accent-emerald)]/15 text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30'
                            : isNextUp
                            ? 'bg-[var(--accent-indigo)]/15 text-[var(--accent-indigo)] border-[var(--accent-indigo)]/30'
                            : 'bg-[var(--bg-elev-2)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}
                      >
                        Milestone 0{i + 1}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-faint)]">
                        ~{estHoursPerMilestone}h effort
                      </span>
                    </div>

                    {/* Dynamic Status Tag */}
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/15 px-2 py-0.5 rounded-md border border-[var(--accent-emerald)]/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : isNextUp ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[var(--accent-indigo)] bg-[var(--accent-indigo)]/15 px-2 py-0.5 rounded-md border border-[var(--accent-indigo)]/30 animate-pulse">
                        <Sparkles className="w-3 h-3 text-[var(--accent-amber)]" />
                        <span>Next Target</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[var(--text-faint)] bg-[var(--bg-elev-2)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                        Upcoming
                      </span>
                    )}
                  </div>

                  {/* Objective Description */}
                  <p
                    className={`text-sm font-medium leading-relaxed font-body transition-all ${
                      isDone
                        ? 'line-through text-[var(--text-muted)] opacity-80'
                        : 'text-[var(--text)] group-hover:text-[var(--text)]'
                    }`}
                  >
                    {obj}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curated Local RAG Study Guides */}
      {phase.resources && phase.resources.length > 0 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span className="font-semibold uppercase tracking-wider">Curated Study Materials & References:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {phase.resources.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onOpenResource?.(r.title)}
                className="p-3 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] hover:border-[var(--accent-indigo)]/50 text-left transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-2 rounded-lg bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold font-display text-[var(--text)] group-hover:text-[var(--accent-indigo)] transition-colors truncate">
                      {r.title}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] truncate mt-0.5">
                      {formatResourceRef(r.url_or_ref)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--accent-indigo)] font-semibold shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <span>Open Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
