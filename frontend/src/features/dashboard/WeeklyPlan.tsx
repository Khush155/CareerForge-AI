import React from 'react';
import type { Roadmap, SkillGap } from '../../lib/schemas';
import {
  Clock,
  Sparkles,
  BookOpen,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface WeeklyPlanProps {
  roadmap: Roadmap | null;
  gaps: SkillGap[];
  onOpenAssessment: () => void;
  onNavigateRoadmap: () => void;
  onOpenResource: (skill: string) => void;
}

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({
  roadmap,
  gaps,
  onOpenAssessment,
  onNavigateRoadmap,
  onOpenResource,
}) => {
  if (!roadmap || roadmap.phases.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] text-center space-y-2">
        <Clock className="w-6 h-6 text-[var(--accent-amber)] mx-auto" />
        <h4 className="text-base font-bold font-display text-[var(--text)]">
          No Active Study Schedule
        </h4>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          Generate or load a career roadmap to view your weekly bandwidth allocation and sprint milestones.
        </p>
      </div>
    );
  }

  // Active phase is typically Phase 1 or the first non-completed phase
  const activePhase = roadmap.phases.find((p) => p.status !== 'completed') || roadmap.phases[0];
  const activePhaseNumber = activePhase?.phase_number || 1;
  const phaseEstWeeks = Math.max(1, Math.ceil(activePhase.estimated_hours / (roadmap.available_hours_per_week || 20)));

  return (
    <div className="p-6 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] font-mono text-xs font-semibold mb-1">
            <Layers className="w-3 h-3" />
            <span>Active Sprint · Phase {activePhaseNumber}</span>
          </div>
          <h3 className="text-lg font-bold font-display text-[var(--text)]">
            {activePhase.title}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-body line-clamp-1">
            {activePhase.learning_objectives?.[0] || 'Core technical foundation & benchmarks'}
          </p>
        </div>

        {/* Weekly hours badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-[var(--text-muted)] font-mono">Weekly Target</div>
            <div className="text-base font-bold font-display text-[var(--text)]">
              {roadmap.available_hours_per_week} <span className="text-xs font-normal text-[var(--text-muted)]">hrs/wk</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateRoadmap}
            className="h-9 px-3.5 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Full Roadmap</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Phase Sprints Mini Progress Track */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono text-[var(--text-muted)]">
          <span>Sprint Sequence ({roadmap.phases.length} Phases)</span>
          <span>
            Phase {activePhaseNumber} of {roadmap.phases.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {roadmap.phases.map((phase) => {
            const isCurrent = phase.phase_number === activePhaseNumber;
            const isPast = phase.status === 'completed' || phase.phase_number < activePhaseNumber;

            return (
              <div
                key={phase.phase_number}
                className={`p-3 rounded-xl border transition-all text-xs ${
                  isCurrent
                    ? 'bg-[var(--accent-indigo)]/10 border-[var(--accent-indigo)] shadow-sm'
                    : isPast
                    ? 'bg-[var(--bg-elev-2)] border-[var(--border)] opacity-60'
                    : 'bg-[var(--bg-elev-2)] border-[var(--border-subtle)]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                  <span className={isCurrent ? 'font-bold text-[var(--accent-indigo)]' : 'text-[var(--text-faint)]'}>
                    P{phase.phase_number}
                  </span>
                  <span className="text-[var(--text-muted)]">{phase.estimated_hours}h</span>
                </div>
                <div className="font-display font-semibold text-[var(--text)] truncate">
                  {phase.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Sprint Focus Skills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Skills Targeted in This Phase
          </span>
          <span className="font-mono text-[var(--text-faint)] text-[11px]">
            ≈ {phaseEstWeeks} weeks to complete
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {activePhase.skills_covered.map((skillName) => {
            const gap = gaps.find((g) => g.skill.toLowerCase() === skillName.toLowerCase());
            return (
              <div
                key={skillName}
                className="p-3 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all flex items-center justify-between text-xs min-h-[58px] gap-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[var(--text)] truncate" title={skillName}>
                    {skillName}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                    {gap ? `Gap: ${gap.gap.toFixed(1)} pts` : 'Phase Core'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenResource(skillName)}
                  title="Read curated study guide"
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-elev-3)] text-[var(--accent-sky)] transition-colors cursor-pointer shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Shortcut Banner */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-elev-2)] p-4 rounded-2xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-[var(--text)] font-display">
              Ready to verify what you've learned?
            </div>
            <div className="text-[var(--text-muted)] font-body">
              Log a practice score to trigger real-time dynamic roadmap recalculation.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAssessment}
          className="w-full sm:w-auto h-9 px-4 rounded-xl bg-[var(--accent-indigo)] hover:opacity-90 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Log Assessment</span>
        </button>
      </div>
    </div>
  );
};
