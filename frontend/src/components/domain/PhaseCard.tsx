import React, { useId, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Sparkles,
  Clock,
  Calendar,
  Award,
  Check,
  RotateCcw,
  Target,
  Stethoscope,
  BarChart3,
  Scale,
  Wrench,
  Trophy,
  ArrowRight,
  Flame,
} from 'lucide-react';
import type { RoadmapPhase, SkillGap } from '../../lib/schemas';
import { formatHours, formatWeeks } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useAppStore } from '../../lib/store';
import { getDomainTheme, isFinalPhase } from '../../lib/domain';

export interface PhaseCardProps {
  phase: RoadmapPhase;
  gaps: SkillGap[];
  weeklyHours?: number;
  highlightedSkill?: string | null;
  onOpenResource?: (title: string) => void;
  isChanged?: boolean;
}

// ── Circular SVG progress ring ────────────────────────────────────────────────
const CircleProgress: React.FC<{
  pct: number;
  completed: number;
  total: number;
  accent: string;
  accentSecondary: string;
  isComplete: boolean;
}> = ({ pct, completed, total, accent, accentSecondary, isComplete }) => {
  const id = useId();
  const R = 26;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;

  return (
    <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: accent }} />
            <stop offset="100%" style={{ stopColor: accentSecondary }} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="32" cy="32" r={R}
          fill="none"
          strokeWidth="5"
          stroke="rgba(255,255,255,0.06)"
        />
        {/* Progress arc */}
        <circle
          cx="32" cy="32" r={R}
          fill="none"
          strokeWidth="5"
          stroke={isComplete ? '#10B981' : `url(#ring-${id})`}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          className="transition-all duration-700"
          style={{ filter: `drop-shadow(0 0 4px ${isComplete ? '#10B981' : accent}66)` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        {isComplete ? (
          <Award className="w-5 h-5" style={{ color: '#10B981' }} />
        ) : (
          <>
            <span className="text-[13px] font-mono font-bold leading-none" style={{ color: 'var(--text)' }}>
              {completed}/{total}
            </span>
            <span className="text-[9px] font-mono leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>
              done
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ── Domain icon for final phase ───────────────────────────────────────────────
const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  Stethoscope: <Stethoscope className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  Wrench: <Wrench className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
};

// ── Main PhaseCard ────────────────────────────────────────────────────────────
export const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  gaps: _gaps,
  weeklyHours = 20,
  highlightedSkill,
  onOpenResource: _onOpenResource,
  isChanged = false,

}) => {
  const { completedMilestones, toggleMilestone, profile, openAssessment } = useAppStore();
  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const domainTheme = getDomainTheme(profile?.target_role || phase.title);
  const isPlacementPhase = isFinalPhase(phase.title);

  // Milestone counters
  const totalMilestones = phase.learning_objectives.length;
  const completedCount = phase.learning_objectives.reduce((acc, _, idx) => {
    return acc + (completedMilestones[`${phase.phase_number}-${idx}`] ? 1 : 0);
  }, 0);
  const completionPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
  const isPhaseComplete = completedCount === totalMilestones && totalMilestones > 0;

  const estimatedWeeks = weeklyHours > 0 ? Math.max(1, Math.round(phase.estimated_hours / weeklyHours)) : 1;
  const estHoursPerMilestone =
    totalMilestones > 0 ? Math.max(1, Math.round(phase.estimated_hours / totalMilestones)) : phase.estimated_hours;

  // First uncompleted milestone
  const firstUnfinishedIdx = phase.learning_objectives.findIndex(
    (_, idx) => !completedMilestones[`${phase.phase_number}-${idx}`]
  );

  // Highlighted check
  const isHighlighted = highlightedSkill
    ? phase.skills_covered.some((s) => s.toLowerCase() === highlightedSkill.toLowerCase())
    : false;

  // Toggle all
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

  // Filtered milestones
  const filteredMilestones = phase.learning_objectives
    .map((obj, i) => ({
      obj,
      i,
      isDone: !!completedMilestones[`${phase.phase_number}-${i}`],
      isNextUp: !completedMilestones[`${phase.phase_number}-${i}`] && i === firstUnfinishedIdx,
    }))
    .filter((item) => {
      if (milestoneFilter === 'pending') return !item.isDone;
      if (milestoneFilter === 'completed') return item.isDone;
      return true;
    });

  return (
    <motion.div
      layout="position"
      layoutId={`phase-${phase.phase_number}`}
      className={cn(
        'relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300',
        'bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-[var(--shadow-card)]',
        isHighlighted && 'ring-2 ring-[var(--accent-indigo)]',
        isChanged && 'ring-2 ring-[var(--accent-sky)] shadow-[0_0_28px_rgba(56,189,248,0.2)]',
        isPhaseComplete && 'border-[var(--accent-emerald)]/35'
      )}
    >
      {/* ── Top colour stripe ─────────────────────────────────── */}
      <div
        className="h-1 w-full"
        style={{
          background: isPhaseComplete
            ? '#10B981'
            : `linear-gradient(90deg, ${domainTheme.accent}, ${domainTheme.accentSecondary})`,
        }}
      />

      <div className="p-6 sm:p-8 flex flex-col gap-6">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left: badge + title + domain pill */}
          <div className="flex items-start gap-4 min-w-0">
            {/* Phase number or trophy badge */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-mono font-bold text-[15px] border"
              style={{
                background: `color-mix(in srgb, ${domainTheme.accent} 14%, transparent)`,
                borderColor: `color-mix(in srgb, ${domainTheme.accent} 30%, transparent)`,
                color: domainTheme.accent,
                boxShadow: `0 0 16px ${domainTheme.accent}22`,
              }}
            >
              {isPlacementPhase ? (DOMAIN_ICONS['Trophy'] ?? `0${phase.phase_number}`) : `0${phase.phase_number}`}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-xl font-bold font-display text-[var(--text)] tracking-tight leading-snug">
                  {phase.title}
                </h3>
                {isPhaseComplete && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-emerald)]/15 border border-[var(--accent-emerald)]/30 text-[11px] font-mono font-bold text-[var(--accent-emerald)] shrink-0">
                    <Award className="w-3 h-3" />
                    <span>Phase Complete</span>
                  </span>
                )}
                {isChanged && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-sky)]/15 border border-[var(--accent-sky)]/30 text-[11px] font-mono font-bold text-[var(--accent-sky)] shrink-0">
                    <Flame className="w-3 h-3" />
                    <span>Updated</span>
                  </span>
                )}
              </div>

              {/* Domain badge + hours + weeks in a row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                    domainTheme.badgeBg, domainTheme.badgeText, domainTheme.badgeBorder
                  )}
                >
                  <span>{domainTheme.emoji}</span>
                  <span>{domainTheme.label}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-elev-2)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
                  <Clock className="w-3 h-3" style={{ color: domainTheme.accent }} />
                  <span className="font-semibold text-[var(--text)]">{formatHours(phase.estimated_hours)}</span>
                  <span>target</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-elev-2)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
                  <Calendar className="w-3 h-3 text-[var(--accent-sky)]" />
                  <span>{formatWeeks(estimatedWeeks)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SKILLS IN SCOPE ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-[var(--text-faint)] flex items-center gap-1 shrink-0">
            <Target className="w-3 h-3" />
            <span>Target Skills:</span>
          </span>
          {phase.skills_covered.map((skill) => (
            <div
              key={skill}
              className="group/skill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] font-mono text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openAssessment(skill);
                }}
                title={`Launch diagnostic test for ${skill}`}
                className="w-4 h-4 rounded flex items-center justify-center opacity-60 group-hover/skill:opacity-100 hover:bg-[var(--accent-indigo)] hover:text-white transition-all cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
              </button>
            </div>
          ))}
        </div>

        {/* ── MILESTONES BLOCK ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Milestones header row: title + ring + filter tabs + mark-all */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <CircleProgress
                pct={completionPct}
                completed={completedCount}
                total={totalMilestones}
                accent={domainTheme.accent}
                accentSecondary={domainTheme.accentSecondary}
                isComplete={isPhaseComplete}
              />
              <div>
                <h4 className="text-base font-bold font-display text-[var(--text)]">
                  Learning Milestones
                </h4>
                <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                  {isPhaseComplete
                    ? 'All milestones mastered 🎉'
                    : `${completionPct}% complete · ${totalMilestones - completedCount} remaining`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Filter Segmented Control */}
              <div className="flex items-center p-0.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setMilestoneFilter('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                    milestoneFilter === 'all'
                      ? 'bg-[var(--accent-indigo)] text-white font-bold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  )}
                >
                  All ({totalMilestones})
                </button>
                <button
                  type="button"
                  onClick={() => setMilestoneFilter('pending')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                    milestoneFilter === 'pending'
                      ? 'bg-[var(--accent-indigo)] text-white font-bold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  )}
                >
                  Pending ({totalMilestones - completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setMilestoneFilter('completed')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                    milestoneFilter === 'completed'
                      ? 'bg-[var(--accent-emerald)] text-white font-bold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  )}
                >
                  Done ({completedCount})
                </button>
              </div>

              {/* Mark-all / reset button */}
              <button
                type="button"
                onClick={handleToggleAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-semibold transition-all cursor-pointer bg-[var(--bg-elev-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]"
              >
                {isPhaseComplete ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                    <span>Reset All</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                    <span>Mark All Done</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Phase Mastered Banner */}
          <AnimatePresence>
            {isPhaseComplete && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[var(--accent-emerald)]/10 border border-[var(--accent-emerald)]/25"
              >
                <div className="flex items-center gap-2.5 text-[var(--accent-emerald)]">
                  <Award className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-semibold font-body">
                    Outstanding! All deliverables for Phase 0{phase.phase_number} are complete.
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[var(--accent-emerald)] shrink-0">
                  100%
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Milestone rows */}
          {filteredMilestones.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-elev-2)]/60 rounded-2xl border border-dashed border-[var(--border)]">
              {milestoneFilter === 'pending'
                ? 'All milestones in this phase are completed! 🎉'
                : 'No completed milestones yet. Click any milestone to check it off.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {filteredMilestones.map(({ obj, i, isDone, isNextUp }) => {
                  const key = `${phase.phase_number}-${i}`;

                  return (
                    <motion.div
                      key={key}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleMilestone(phase.phase_number, i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleMilestone(phase.phase_number, i);
                        }
                      }}
                      className={cn(
                        'group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200',
                        isDone
                          ? 'bg-[var(--accent-emerald)]/[0.05] border-[var(--accent-emerald)]/20 hover:border-[var(--accent-emerald)]/40'
                          : isNextUp
                          ? 'bg-[var(--bg-elev-2)] border-transparent hover:border-transparent'
                          : 'bg-[var(--bg-elev-2)]/40 border-[var(--border)] hover:bg-[var(--bg-elev-2)] hover:border-[var(--border-strong)]'
                      )}
                      style={
                        isNextUp && !isDone
                          ? {
                              borderLeft: `3px solid ${domainTheme.accent}`,
                              boxShadow: `0 0 20px ${domainTheme.accent}18, inset 0 0 0 1px ${domainTheme.accent}18`,
                            }
                          : undefined
                      }
                    >
                      {/* ── Circle checkbox ── */}
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all duration-200',
                          isDone
                            ? 'border-transparent scale-105'
                            : isNextUp
                            ? 'border-opacity-80 group-hover:scale-105'
                            : 'border-[var(--border-strong)] bg-transparent group-hover:scale-105'
                        )}
                        style={
                          isDone
                            ? {
                                background: '#10B981',
                                boxShadow: '0 0 14px rgba(16, 185, 129, 0.45)',
                              }
                            : isNextUp
                            ? {
                                borderColor: domainTheme.accent,
                                background: `${domainTheme.accent}18`,
                              }
                            : undefined
                        }
                      >
                        {isDone ? (
                          <Check
                            className="w-3.5 h-3.5 stroke-[2.5]"
                            style={{ color: 'var(--milestone-tick-color)' }}
                          />
                        ) : isNextUp ? (
                          <ArrowRight className="w-3 h-3" style={{ color: domainTheme.accent }} />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full bg-[var(--border-strong)] group-hover:bg-[var(--text-faint)] transition-colors"
                          />
                        )}
                      </div>

                      {/* ── Content ── */}
                      <div className="flex-1 min-w-0">
                        {/* Top meta row */}
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            {/* M-0X badge */}
                            <span
                              className={cn(
                                'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border',
                                isDone
                                  ? 'bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] border-[var(--accent-emerald)]/25'
                                  : isNextUp
                                  ? 'border'
                                  : 'bg-[var(--bg-elev-3)] text-[var(--text-faint)] border-[var(--border)]'
                              )}
                              style={
                                isNextUp && !isDone
                                  ? {
                                      background: `${domainTheme.accent}18`,
                                      color: domainTheme.accent,
                                      borderColor: `${domainTheme.accent}40`,
                                    }
                                  : undefined
                              }
                            >
                              M-0{i + 1}
                            </span>

                            {/* Hours */}
                            <span className="text-[10px] font-mono text-[var(--text-faint)]">
                              ~{estHoursPerMilestone}h
                            </span>
                          </div>

                          {/* Status tag + Quick Test button */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const primarySkill = phase.skills_covered[0] || profile?.target_role;
                                if (primarySkill) openAssessment(primarySkill);
                              }}
                              title="Assess competency with live quiz or diagnostic score"
                              className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-lg bg-[var(--bg-elev-3)] hover:bg-[var(--accent-indigo)] hover:text-white border border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
                              <span>Quick Test</span>
                            </button>

                            {isDone ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10 px-2 py-0.5 rounded-full border border-[var(--accent-emerald)]/25">
                                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                <span>Completed</span>
                              </span>
                            ) : isNextUp ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                                style={{
                                  color: domainTheme.accent,
                                  background: `${domainTheme.accent}18`,
                                  borderColor: `${domainTheme.accent}40`,
                                }}
                              >
                                <Sparkles className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
                                <span>Next Up</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-[var(--text-faint)] bg-[var(--bg-elev-3)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Objective text */}
                        <p
                          className={cn(
                            'text-sm font-body leading-relaxed transition-all',
                            isDone
                              ? 'line-through text-[var(--text-muted)] opacity-70'
                              : isNextUp
                              ? 'text-[var(--text)] font-medium'
                              : 'text-[var(--text-muted)] group-hover:text-[var(--text)]'
                          )}
                        >
                          {obj}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
