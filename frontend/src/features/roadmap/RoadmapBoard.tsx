import React from 'react';
import { motion } from 'motion/react';
import type { RoadmapPhase, SkillGap } from '../../lib/schemas';
import { useAppStore } from '../../lib/store';
import {
  Circle,
  BookOpen,
  Check,
} from 'lucide-react';

interface RoadmapBoardProps {
  phases: RoadmapPhase[];
  gaps?: SkillGap[];
  weeklyHours?: number;
  onOpenResource?: (title: string) => void;
}

export const RoadmapBoard: React.FC<RoadmapBoardProps> = ({
  phases,
  weeklyHours = 20,
  onOpenResource,
}) => {
  const { completedMilestones, toggleMilestone } = useAppStore();

  // Categorize phases into Kanban columns
  const activePhases = phases.filter((p) => p.status === 'in_progress' || (p.status === 'not_started' && p.phase_number === 1));
  const upcomingPhases = phases.filter((p) => p.status === 'not_started' && p.phase_number !== 1);
  const completedPhases = phases.filter((p) => p.status === 'completed');

  const columns = [
    {
      id: 'active',
      title: 'Current Active Sprint',
      badge: `${activePhases.length} Phase`,
      color: 'var(--accent-indigo)',
      phases: activePhases,
    },
    {
      id: 'upcoming',
      title: 'Scheduled Sprints',
      badge: `${upcomingPhases.length} Phases`,
      color: 'var(--accent-sky)',
      phases: upcomingPhases,
    },
    {
      id: 'completed',
      title: 'Mastered / Retained',
      badge: `${completedPhases.length} Phases`,
      color: 'var(--color-mastered)',
      phases: completedPhases,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {columns.map((col) => (
        <div
          key={col.id}
          className="rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] p-5 space-y-4 shadow-sm"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <h4 className="text-sm font-bold font-display text-[var(--text)]">
                {col.title}
              </h4>
            </div>
            <span className="font-mono text-[11px] text-[var(--text-muted)] bg-[var(--bg-elev-2)] px-2.5 py-0.5 rounded-full border border-[var(--border)]">
              {col.badge}
            </span>
          </div>

          {/* Column Cards */}
          <div className="space-y-4">
            {col.phases.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-elev-2)] rounded-2xl border border-dashed border-[var(--border)]">
                No phases in this column.
              </div>
            ) : (
              col.phases.map((phase) => {
                const totalMilestones = phase.learning_objectives?.length || 0;
                const completedCount = (phase.learning_objectives || []).reduce((acc, _, idx) => {
                  const key = `${phase.phase_number}-${idx}`;
                  return acc + (completedMilestones[key] ? 1 : 0);
                }, 0);
                const progressPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
                const estWeeks = Math.max(1, Math.ceil(phase.estimated_hours / (weeklyHours || 20)));

                return (
                  <motion.div
                    key={phase.phase_number}
                    layout="position"
                    className="p-5 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all shadow-sm space-y-3.5"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] font-mono text-xs font-bold flex items-center justify-center">
                          P{phase.phase_number}
                        </span>
                        <h5 className="text-sm font-bold font-display text-[var(--text)] line-clamp-1">
                          {phase.title}
                        </h5>
                      </div>

                      <span className="font-mono text-xs text-[var(--accent-amber)] font-semibold shrink-0">
                        {phase.estimated_hours}h · ≈{estWeeks}w
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)]">
                        <span>Checklist Progress</span>
                        <span>
                          {completedCount}/{totalMilestones} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--bg-elev-3)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-indigo)] to-[var(--color-mastered)] transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Interactive Milestone Checkboxes */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] tracking-wider block">
                        Milestones ({totalMilestones})
                      </span>
                      {phase.learning_objectives.map((milestone, mIdx) => {
                        const mKey = `${phase.phase_number}-${mIdx}`;
                        const isDone = !!completedMilestones[mKey];

                        return (
                          <div
                            key={mKey}
                            onClick={() => toggleMilestone(phase.phase_number, mIdx)}
                            className={`p-2 rounded-xl border text-xs flex items-start gap-2 cursor-pointer transition-colors ${
                              isDone
                                ? 'bg-[var(--color-mastered)]/5 border-[var(--color-mastered)]/30 text-[var(--text-muted)] line-through'
                                : 'bg-[var(--bg-elev-1)] border-[var(--border)] hover:border-[var(--accent-indigo)]/50 text-[var(--text)]'
                            }`}
                          >
                            <span className="shrink-0 mt-0.5">
                              {isDone ? (
                                <div className="w-3.5 h-3.5 rounded-sm bg-[var(--color-mastered)] flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3] text-black dark:text-white" style={{ color: 'var(--milestone-tick-color)' }} />
                                </div>
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                              )}
                            </span>
                            <span className="leading-snug">{milestone}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {phase.skills_covered.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-[var(--bg-elev-1)] text-[var(--text-muted)] border border-[var(--border)] font-mono text-[10px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Resources */}
                    {phase.resources && phase.resources.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-[var(--text-faint)]">
                          {phase.resources.length} study resource{phase.resources.length > 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenResource?.(phase.resources[0].title)}
                          className="text-xs font-semibold text-[var(--accent-sky)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>View Prep Guide</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
