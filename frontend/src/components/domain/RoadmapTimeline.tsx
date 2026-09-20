import React, { useState } from 'react';
import type { RoadmapPhase, SkillGap } from '../../lib/schemas';
import { PhaseCard } from './PhaseCard';
import { Card3DTilt } from '../3d/Card3DTilt';
import { Compass, Calendar, ListOrdered, Clock, CheckCircle2 } from 'lucide-react';
import { formatHours } from '../../lib/format';

export interface RoadmapTimelineProps {
  phases: RoadmapPhase[];
  gaps: SkillGap[];
  weeklyHours?: number;
  highlightedSkill?: string | null;
  onOpenResource?: (title: string) => void;
  changedPhases?: number[];
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  phases,
  gaps,
  weeklyHours = 20,
  highlightedSkill,
  onOpenResource,
  changedPhases = [],
}) => {
  const [viewMode, setViewMode] = useState<'phases' | 'calendar'>('phases');

  if (phases.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-quiet)] border border-[var(--border-default)] flex items-center justify-center text-[var(--accent)]">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>
        <p className="text-base font-semibold text-[var(--text-primary)]">
          No roadmap generated yet
        </p>
        <p className="text-xs text-[var(--text-muted)] max-w-sm">
          Select a career track above and click &quot;Forge Adaptive Roadmap&quot; to synthesize your personalized curriculum.
        </p>
      </div>
    );
  }

  // Calculate cumulative weeks for calendar view
  let cumulativeWeeks = 0;
  const calendarWeeks = phases.map((phase) => {
    const phaseWeeks = Math.max(1, Math.round(phase.estimated_hours / (weeklyHours || 20)));
    const startWeek = cumulativeWeeks + 1;
    const endWeek = cumulativeWeeks + phaseWeeks;
    cumulativeWeeks = endWeek;
    return {
      phase,
      startWeek,
      endWeek,
      phaseWeeks,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      {/* View Mode Toggle Bar */}
      <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-[var(--border-subtle)]">
        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
          Curriculum Execution Architecture:
        </span>
        <div className="flex items-center gap-1 bg-[var(--bg-sunken)] p-1 rounded-xl border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setViewMode('phases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'phases'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Phased Sequence</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly Calendar Schedule</span>
          </button>
        </div>
      </div>

      {viewMode === 'phases' ? (
        /* Sequential Phases View with Fiber-Optic Spine */
        <div className="relative flex flex-col gap-6 pl-4 max-md:pl-0">
          <div
            className="absolute top-6 bottom-6 left-1 w-[2px] pointer-events-none hidden md:block"
            style={{
              background: 'linear-gradient(180deg, var(--neon-cyan) 0%, var(--neon-indigo) 50%, var(--neon-violet) 100%)',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)',
            }}
          />

          {phases.map((phase) => (
            <div key={phase.phase_number} className="relative">
              <div className="absolute -left-5 top-7 w-3 h-3 rounded-full bg-[var(--neon-cyan)] border-2 border-[var(--bg-base)] shadow-[0_0_8px_var(--neon-cyan)] z-10 hidden md:block" />
              <Card3DTilt intensity={2} glare={true}>
                <PhaseCard
                  phase={phase}
                  gaps={gaps}
                  weeklyHours={weeklyHours}
                  highlightedSkill={highlightedSkill}
                  onOpenResource={onOpenResource}
                  isChanged={changedPhases.includes(phase.phase_number)}
                />
              </Card3DTilt>
            </div>
          ))}
        </div>
      ) : (
        /* Weekly Calendar Schedule View */
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {calendarWeeks.map((item) => (
            <div
              key={item.phase.phase_number}
              className="glass-card rounded-2xl p-5 flex flex-col gap-3 border border-[var(--border-default)]"
            >
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
                <span className="font-mono text-xs font-bold text-[var(--neon-cyan)]">
                  WEEKS {item.startWeek} – {item.endWeek}
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--neon-indigo)]" /> {formatHours(item.phase.estimated_hours)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                  Phase {item.phase.phase_number} Focus:
                </span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                  {item.phase.title}
                </h4>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[11px] font-mono text-[var(--text-muted)]">Core Milestones:</span>
                <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                  {item.phase.learning_objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--neon-cyan)] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">{weeklyHours} hrs/wk</span>
                <button
                  type="button"
                  onClick={() => onOpenResource?.(item.phase.skills_covered[0] || item.phase.title)}
                  className="text-[var(--neon-cyan)] hover:underline cursor-pointer"
                >
                  View Guide ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
