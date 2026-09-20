import React, { useState } from 'react';
import type { RoadmapPhase, SkillGap } from '../../lib/schemas';
import { PhaseCard } from './PhaseCard';
import { RoadmapBoard } from '../../features/roadmap/RoadmapBoard';
import { PhaseRationale } from '../../features/roadmap/PhaseRationale';
import { VersionCompare } from '../../features/roadmap/VersionCompare';
import { useAppStore } from '../../lib/store';
import {
  Compass,
  Calendar,
  ListOrdered,
  Kanban,
  GitCompare,
} from 'lucide-react';

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
  const { roadmap, previousRoadmap, profile } = useAppStore();
  const [viewMode, setViewMode] = useState<'phases' | 'board' | 'calendar'>('phases');
  const [showVersionCompare, setShowVersionCompare] = useState(false);

  if (phases.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-[var(--bg-elev-1)] rounded-3xl border border-[var(--border)]">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] flex items-center justify-center">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>
        <p className="text-base font-bold font-display text-[var(--text)]">
          No Roadmap Generated Yet
        </p>
        <p className="text-xs text-[var(--text-muted)] max-w-sm">
          Select or search a career track from the Home screen to synthesize your personalized curriculum.
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
    <div className="flex flex-col gap-6">
      {/* Version Comparison Modal */}
      {showVersionCompare && roadmap && (
        <VersionCompare
          currentRoadmap={roadmap}
          previousRoadmap={previousRoadmap}
          onClose={() => setShowVersionCompare(false)}
        />
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Roadmap Execution Architecture:
          </span>
          {roadmap && (
            <button
              type="button"
              onClick={() => setShowVersionCompare(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-indigo)]/10 hover:bg-[var(--accent-indigo)]/20 border border-[var(--accent-indigo)]/30 text-[11px] font-mono font-bold text-[var(--accent-indigo)] transition-all cursor-pointer"
            >
              <GitCompare className="w-3 h-3" />
              <span>Version History (v{roadmap.version.toFixed(1)})</span>
            </button>
          )}
        </div>

        {/* View Switch Pills */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] shrink-0 select-none">
          <button
            type="button"
            onClick={() => setViewMode('phases')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'phases'
                ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'board'
                ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* Why This Order? Prerequisite Architecture Rationale Callout */}
      <PhaseRationale targetRole={profile?.target_role || 'Target Career Track'} />

      {/* VIEW: Board View */}
      {viewMode === 'board' && (
        <RoadmapBoard
          phases={phases}
          gaps={gaps}
          weeklyHours={weeklyHours}
          onOpenResource={onOpenResource}
        />
      )}

      {/* VIEW: Phased Sequence Timeline */}
      {viewMode === 'phases' && (
        <div className="relative flex flex-col gap-6 pl-4 max-md:pl-0">
          <div
            className="absolute top-6 bottom-6 left-1 w-[2px] pointer-events-none hidden md:block"
            style={{
              background: 'linear-gradient(180deg, var(--accent-sky) 0%, var(--accent-indigo) 50%, var(--accent-violet) 100%)',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
            }}
          />

          {phases.map((phase) => {
            const isChanged = changedPhases.includes(phase.phase_number);
            return (
              <div key={phase.phase_number} className="relative">
                {/* Visual Node Dot on the Timeline Spine */}
                <div
                  className="absolute -left-[19px] top-8 w-3 h-3 rounded-full bg-[var(--bg-elev-1)] border-2 hidden md:block z-10 transition-all duration-300"
                  style={{
                    borderColor: isChanged ? 'var(--accent-sky)' : 'var(--accent-indigo)',
                    boxShadow: isChanged ? '0 0 10px var(--accent-sky)' : 'none',
                  }}
                />

                <PhaseCard
                  phase={phase}
                  gaps={gaps}
                  weeklyHours={weeklyHours}
                  highlightedSkill={highlightedSkill}
                  onOpenResource={onOpenResource}
                  isChanged={isChanged}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: Calendar Schedule View */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendarWeeks.map(({ phase, startWeek, endWeek, phaseWeeks }) => (
            <div
              key={phase.phase_number}
              className="p-5 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] flex flex-col justify-between space-y-4 hover:border-[var(--border-strong)] transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[var(--accent-indigo)] font-semibold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Weeks {startWeek}–{endWeek}</span>
                  </span>
                  <span className="text-[var(--text-muted)] font-normal">
                    {phaseWeeks} wk{phaseWeeks > 1 ? 's' : ''}
                  </span>
                </div>
                <h4 className="text-base font-bold font-display text-[var(--text)] line-clamp-1">
                  Phase {phase.phase_number}: {phase.title}
                </h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 font-body">
                  Target: {phase.estimated_hours} hours total ({weeklyHours}h / week)
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-[11px] font-mono text-[var(--text-faint)] uppercase">
                  Skills In Scope
                </div>
                <div className="flex flex-wrap gap-1">
                  {phase.skills_covered.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md bg-[var(--bg-elev-2)] text-[var(--text)] border border-[var(--border)] text-[10px] font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
