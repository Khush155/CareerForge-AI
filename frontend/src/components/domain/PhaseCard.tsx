import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, Circle, Sparkles, Clock, Calendar, Award } from 'lucide-react';
import type { RoadmapPhase, SkillGap } from '../../lib/schemas';
import { formatHours, formatWeeks } from '../../lib/format';
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
    border: 'var(--priority-high)',
    glow: '0 0 16px rgba(244, 63, 94, 0.25)',
    badge: 'bg-[var(--priority-high)]/15 text-[var(--priority-high)] border-[var(--priority-high)]/30',
  },
  Medium: {
    border: 'var(--priority-medium)',
    glow: '0 0 16px rgba(245, 158, 11, 0.25)',
    badge: 'bg-[var(--priority-medium)]/15 text-[var(--priority-medium)] border-[var(--priority-medium)]/30',
  },
  Low: {
    border: 'var(--priority-low)',
    glow: '0 0 16px rgba(16, 185, 129, 0.25)',
    badge: 'bg-[var(--priority-low)]/15 text-[var(--priority-low)] border-[var(--priority-low)]/30',
  },
  Mastered: {
    border: 'var(--priority-mastered)',
    glow: 'none',
    badge: 'bg-[var(--priority-mastered)]/15 text-[var(--priority-mastered)] border-[var(--priority-mastered)]/30',
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

  // Check how many milestones are completed
  const totalMilestones = phase.learning_objectives.length;
  const completedCount = phase.learning_objectives.reduce((acc, _, idx) => {
    const key = `${phase.phase_number}-${idx}`;
    return acc + (completedMilestones[key] ? 1 : 0);
  }, 0);

  const completionPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
  const isPhaseComplete = completedCount === totalMilestones && totalMilestones > 0;

  const estimatedWeeks = weeklyHours > 0 ? Math.max(1, Math.round(phase.estimated_hours / weeklyHours)) : 1;

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

  return (
    <motion.div
      layout="position"
      layoutId={`phase-${phase.phase_number}`}
      style={{
        borderLeftColor: isPhaseComplete ? 'var(--neon-emerald)' : theme.border,
        boxShadow: isHighlighted ? theme.glow : undefined,
      }}
      className={cn(
        'glass-card border border-[var(--border-default)] rounded-3xl p-6 sm:p-7 flex flex-col gap-4 relative overflow-hidden transition-all duration-300',
        isHighlighted && 'bg-[var(--accent-quiet)] scale-[1.01]',
        isChanged && 'ring-2 ring-[var(--neon-cyan)] shadow-[0_0_25px_rgba(0,242,254,0.35)]',
        isPhaseComplete && 'bg-[var(--neon-emerald)]/5'
      )}
    >
      {/* Rounded Left Priority Accent Bar */}
      <div
        className="absolute top-4 bottom-4 left-0 w-1.5 rounded-r-full"
        style={{ backgroundColor: isPhaseComplete ? 'var(--neon-emerald)' : theme.border }}
      />
      {/* Top Header */}
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-default)] font-mono text-sm font-bold text-[var(--neon-cyan)] flex items-center justify-center shadow-inner">
            0{phase.phase_number}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight font-sans">
                {phase.title}
              </h3>
              {isPhaseComplete && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--neon-emerald)]/15 border border-[var(--neon-emerald)]/30 text-[10px] font-mono font-bold text-[var(--neon-emerald)] flex items-center gap-1">
                  <Award className="w-3 h-3" /> Phase Mastered
                </span>
              )}
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Stage {phase.phase_number} of sequential plan
            </span>
          </div>
        </div>

        {/* Phase Duration Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium">
            <Clock className="w-3 h-3 text-[var(--neon-indigo)]" />
            {formatHours(phase.estimated_hours)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-sunken)] border border-[var(--border-default)] text-[var(--text-secondary)]">
            <Calendar className="w-3 h-3 text-[var(--neon-cyan)]" />
            {formatWeeks(estimatedWeeks)}
          </span>
        </div>
      </div>

      {/* Target Skills Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">Target Domains:</span>
        {phase.skills_covered.map((skill) => (
          <span
            key={skill}
            className="bg-[var(--bg-sunken)] border border-[var(--border-subtle)] hover:border-[var(--neon-cyan)] rounded-lg px-2.5 py-0.5 font-mono text-xs text-[var(--text-primary)] transition-colors"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Milestone Progress Bar */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-[var(--text-muted)]">Milestone Progress</span>
          <span className={isPhaseComplete ? 'text-[var(--neon-emerald)] font-bold' : 'text-[var(--text-secondary)] font-medium'}>
            {completedCount} / {totalMilestones} Milestones ({completionPct}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-[var(--bg-sunken)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${completionPct}%`,
              background: isPhaseComplete
                ? 'var(--neon-emerald)'
                : 'linear-gradient(90deg, var(--neon-cyan), var(--neon-indigo))',
            }}
          />
        </div>
      </div>

      {/* Interactive Milestones & Objectives Checklist */}
      <div className="flex flex-col gap-2 pt-1">
        <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
          Milestones & Deliverables (Click to check off):
        </span>
        <ul className="flex flex-col gap-2 list-none">
          {phase.learning_objectives.map((obj, i) => {
            const key = `${phase.phase_number}-${i}`;
            const isDone = !!completedMilestones[key];

            return (
              <li
                key={i}
                onClick={() => toggleMilestone(phase.phase_number, i)}
                className="flex items-start gap-2.5 text-sm cursor-pointer group select-none p-2 rounded-xl hover:bg-[var(--bg-raised)] transition-colors"
              >
                <button
                  type="button"
                  aria-label={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                  className="mt-0.5 text-[var(--text-muted)] group-hover:text-[var(--neon-cyan)] transition-colors shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--neon-emerald)]" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <span
                  className={cn(
                    'text-sm leading-snug transition-all font-sans',
                    isDone
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                  )}
                >
                  {obj}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Curated Local RAG Study Guides */}
      {phase.resources && phase.resources.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--neon-violet)]" /> Curated Knowledge Base:
          </span>
          {phase.resources.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onOpenResource?.(r.title)}
              className="text-xs font-mono text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 hover:bg-[var(--neon-cyan)]/20 border border-[var(--neon-cyan)]/30 rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="font-semibold">{r.title}</span>
              <span className="text-[var(--text-muted)] text-[10px]">({r.url_or_ref})</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
