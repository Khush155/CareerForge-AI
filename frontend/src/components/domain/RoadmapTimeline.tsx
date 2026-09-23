import React, { useState, useRef } from 'react';
import type { RoadmapPhase, SkillGap } from '../../lib/schemas';
import { PhaseCard } from './PhaseCard';
import { PhaseRationale } from '../../features/roadmap/PhaseRationale';
import { VersionCompare } from '../../features/roadmap/VersionCompare';
import { useAppStore } from '../../lib/store';
import { getDomainTheme } from '../../lib/domain';
import { cn } from '../../lib/cn';
import {
  Compass,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  GitCompare,
  Layers,
  Award,
  Target,
  TrendingUp,
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
  const { roadmap, previousRoadmap, profile, completedMilestones } = useAppStore();
  const domainTheme = getDomainTheme(profile?.target_role || '');
  const [activeView, setActiveView] = useState<'schedule' | 'expanded'>('schedule');
  const [selectedPhaseNumber, setSelectedPhaseNumber] = useState<number>(() => {
    return phases[0]?.phase_number || 1;
  });
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const detailSectionRef = useRef<HTMLDivElement>(null);

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

    // Calculate milestone progress for each phase card
    const totalMilestones = phase.learning_objectives.length;
    const completedCount = phase.learning_objectives.reduce((acc, _, idx) => {
      const key = `${phase.phase_number}-${idx}`;
      return acc + (completedMilestones[key] ? 1 : 0);
    }, 0);
    const completionPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
    const isPhaseComplete = completedCount === totalMilestones && totalMilestones > 0;

    return {
      phase,
      startWeek,
      endWeek,
      phaseWeeks,
      totalMilestones,
      completedCount,
      completionPct,
      isPhaseComplete,
    };
  });

  // Calculate overall roadmap metrics
  const totalRoadmapMilestones = phases.reduce((acc, p) => acc + p.learning_objectives.length, 0);
  const totalCompletedMilestones = phases.reduce((acc, p) => {
    return (
      acc +
      p.learning_objectives.reduce((pAcc, _, idx) => {
        return pAcc + (completedMilestones[`${p.phase_number}-${idx}`] ? 1 : 0);
      }, 0)
    );
  }, 0);
  const overallCompletionPct =
    totalRoadmapMilestones > 0 ? Math.round((totalCompletedMilestones / totalRoadmapMilestones) * 100) : 0;
  const totalRoadmapHours = phases.reduce((acc, p) => acc + p.estimated_hours, 0);

  const activePhaseNumber = phases.some((p) => p.phase_number === selectedPhaseNumber)
    ? selectedPhaseNumber
    : (phases[0]?.phase_number || 1);

  const activeCalendarItem =
    calendarWeeks.find((c) => c.phase.phase_number === activePhaseNumber) || calendarWeeks[0];

  const handleSelectPhase = (phaseNum: number) => {
    setSelectedPhaseNumber(phaseNum);
    if (detailSectionRef.current) {
      detailSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

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

      {/* ROADMAP EXECUTIVE MISSION-CONTROL BAR */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Target Track Identity */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl border shadow-sm"
              style={{
                background: `color-mix(in srgb, ${domainTheme.accent} 14%, transparent)`,
                borderColor: `color-mix(in srgb, ${domainTheme.accent} 30%, transparent)`,
              }}
            >
              <span>{domainTheme.emoji}</span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-display text-[var(--text)] tracking-tight">
                  {profile?.target_role || 'Personalized Career Track'}
                </h2>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                    domainTheme.badgeBg,
                    domainTheme.badgeText,
                    domainTheme.badgeBorder
                  )}
                >
                  <span>{domainTheme.label}</span>
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                {profile?.degree ? `${profile.degree} in ${profile.branch}` : 'Curriculum Architecture'} · {phases.length} Synthesized Phases
              </p>
            </div>
          </div>

          {/* Quick Metrics & Revision pill */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Completion Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-xs font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
              <span className="text-[var(--text-muted)]">Readiness:</span>
              <strong className="text-[var(--accent-emerald)] font-bold">
                {totalCompletedMilestones}/{totalRoadmapMilestones} ({overallCompletionPct}%)
              </strong>
            </div>

            {/* Total Duration & Allocation */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-[var(--accent-indigo)]" />
              <span className="text-[var(--text-muted)]">Runway:</span>
              <strong className="text-[var(--text)]">{cumulativeWeeks} wks</strong>
              <span className="text-[var(--text-faint)]">({totalRoadmapHours}h @ {weeklyHours}h/w)</span>
            </div>

            {/* Version Revision History */}
            {roadmap && (
              <button
                type="button"
                onClick={() => setShowVersionCompare(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-indigo)]/10 hover:bg-[var(--accent-indigo)]/20 border border-[var(--accent-indigo)]/30 text-xs font-mono font-bold text-[var(--accent-indigo)] transition-all cursor-pointer shadow-sm"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>v{roadmap.version.toFixed(1)} {roadmap.version > 1 ? 'Adapted' : 'Curriculum'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Line Bar */}
        <div className="space-y-1.5 pt-1 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[var(--accent-sky)]" />
              <span>Full Curriculum Milestone Execution</span>
            </span>
            <span>
              {overallCompletionPct === 100 ? (
                <span className="text-[var(--accent-emerald)] font-bold flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  All Milestones Cleared!
                </span>
              ) : (
                `${totalRoadmapMilestones - totalCompletedMilestones} milestones remaining to completion`
              )}
            </span>
          </div>

          <div className="w-full h-2 bg-[var(--bg-sunken)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${overallCompletionPct}%`,
                background:
                  overallCompletionPct === 100
                    ? 'var(--accent-emerald)'
                    : `linear-gradient(90deg, ${domainTheme.accent}, var(--accent-sky))`,
              }}
            />
          </div>
        </div>

        {/* 3-WAY VIEW SWITCHER TABS */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-[var(--border-subtle)] flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveView('schedule')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer select-none',
                activeView === 'schedule'
                  ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('expanded')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer select-none',
                activeView === 'expanded'
                  ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Phases ({phases.length})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-[var(--text-faint)] hidden sm:inline">
            Interactive multi-view roadmap engine
          </span>
        </div>
      </div>

      {/* Why This Order? Prerequisite Architecture Rationale Callout */}
      <PhaseRationale targetRole={profile?.target_role || 'Target Career Track'} />

      {/* VIEW 1: TIMELINE SCHEDULE (Calendar Grid + Active Phase Card) */}
      {activeView === 'schedule' && (
        <div className="flex flex-col gap-6">
          {/* Calendar Schedule Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-mono text-[var(--text-faint)] uppercase tracking-wider">
                Sequential Phased Schedule (Click any phase to inspect details below):
              </span>
              <span className="text-xs font-mono text-[var(--accent-indigo)] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[var(--accent-amber)]" />
                Active Focus: Phase 0{activePhaseNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {calendarWeeks.map(
                ({
                  phase,
                  startWeek,
                  endWeek,
                  phaseWeeks,
                  totalMilestones,
                  completedCount,
                  completionPct,
                  isPhaseComplete,
                }) => {
                  const isSelected = activePhaseNumber === phase.phase_number;
                  const isChanged = changedPhases.includes(phase.phase_number);

                  return (
                    <div
                      key={phase.phase_number}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectPhase(phase.phase_number)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectPhase(phase.phase_number);
                        }
                      }}
                      className={`group relative p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-4 text-left shadow-sm ${
                        isSelected
                          ? 'bg-[var(--bg-elev-2)] border-[var(--accent-indigo)] ring-2 ring-[var(--accent-indigo)]/40 shadow-lg'
                          : 'bg-[var(--bg-elev-1)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]/60'
                      } ${isChanged ? 'ring-2 ring-[var(--accent-sky)]' : ''}`}
                    >
                      {/* Top Bar: Week Badge and Duration */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                              isSelected
                                ? 'text-white'
                                : `${domainTheme.badgeBg} ${domainTheme.badgeText} ${domainTheme.badgeBorder} border`
                            }`}
                            style={isSelected ? { background: domainTheme.accent } : undefined}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Weeks {startWeek}–{endWeek}</span>
                          </span>

                          <span className="text-[var(--text-muted)] text-[11px] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[var(--text-faint)]" />
                            <span>{phaseWeeks} wk{phaseWeeks > 1 ? 's' : ''}</span>
                          </span>
                        </div>

                        {/* Phase Header */}
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'text-white border-transparent'
                                : 'bg-[var(--bg-sunken)] text-[var(--text)] border-[var(--border)]'
                            }`}
                            style={isSelected ? { background: domainTheme.accent, borderColor: domainTheme.accent } : undefined}
                          >
                            0{phase.phase_number}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold font-display text-[var(--text)] leading-snug line-clamp-2">
                              {phase.title}
                            </h4>
                            <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                              {phase.estimated_hours}h target effort
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Milestone Progress in Phase */}
                      <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[var(--text-muted)]">Milestones:</span>
                          <span
                            className={
                              isPhaseComplete
                                ? 'text-[var(--accent-emerald)] font-bold flex items-center gap-1'
                                : 'text-[var(--text)] font-semibold'
                            }
                          >
                            {isPhaseComplete ? (
                              <>
                                <Award className="w-3 h-3 text-[var(--accent-emerald)]" />
                                <span>Done</span>
                              </>
                            ) : (
                              `${completedCount}/${totalMilestones} (${completionPct}%)`
                            )}
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-[var(--bg-sunken)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                          <div
                            className="h-full transition-all duration-300 rounded-full"
                            style={{
                              width: `${completionPct}%`,
                              background: isPhaseComplete
                                ? 'var(--accent-emerald)'
                                : 'linear-gradient(90deg, var(--accent-sky), var(--accent-indigo))',
                            }}
                          />
                        </div>
                      </div>

                      {/* Target Skills Chips Preview */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {phase.skills_covered.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border-subtle)] text-[10px] font-mono truncate max-w-[130px]"
                            >
                              {s}
                            </span>
                          ))}
                          {phase.skills_covered.length > 3 && (
                            <span className="text-[10px] font-mono text-[var(--text-faint)] self-center">
                              +{phase.skills_covered.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Link / Selected State */}
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--accent-indigo)]">
                            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                            <span>Inspecting Phase 0{phase.phase_number}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                            <span>Click to view details</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        )}

                        {isPhaseComplete && (
                          <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* DEDICATED PHASE INFORMATION INSPECTION SECTION */}
          {activeCalendarItem && (
            <div ref={detailSectionRef} className="flex flex-col gap-4 pt-2">
              {/* Section Header with Phase Title and Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-5 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-indigo)]/15 border border-[var(--accent-indigo)]/30 text-xs font-mono font-bold text-[var(--accent-indigo)] flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Phase 0{activeCalendarItem.phase.phase_number} Dedicated Roadmap</span>
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      Weeks {activeCalendarItem.startWeek}–{activeCalendarItem.endWeek} ({activeCalendarItem.phaseWeeks} weeks window)
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-[var(--text)] mt-1.5">
                    {activeCalendarItem.phase.title}
                  </h3>
                </div>

                {/* Previous / Next Phase Navigation Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={activePhaseNumber <= 1}
                    onClick={() => {
                      const prev = [...phases].reverse().find((p) => p.phase_number < activePhaseNumber);
                      if (prev) handleSelectPhase(prev.phase_number);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elev-2)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--bg-elev-3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev Phase</span>
                  </button>

                  <button
                    type="button"
                    disabled={activePhaseNumber >= phases[phases.length - 1]?.phase_number}
                    onClick={() => {
                      const next = phases.find((p) => p.phase_number > activePhaseNumber);
                      if (next) handleSelectPhase(next.phase_number);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elev-2)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--bg-elev-3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next Phase</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dedicated Full Phase Card with Interactive Milestones & Resources */}
              <PhaseCard
                phase={activeCalendarItem.phase}
                gaps={gaps}
                weeklyHours={weeklyHours}
                highlightedSkill={highlightedSkill}
                onOpenResource={onOpenResource}
                isChanged={changedPhases.includes(activeCalendarItem.phase.phase_number)}
              />
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ALL PHASES EXPANDED */}
      {activeView === 'expanded' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono text-[var(--text-faint)] uppercase tracking-wider">
              Comprehensive Sequential Curriculum ({phases.length} Phases Expanded):
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {totalCompletedMilestones}/{totalRoadmapMilestones} Milestones Completed ({overallCompletionPct}%)
            </span>
          </div>

          <div className="flex flex-col gap-6">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.phase_number}
                phase={phase}
                gaps={gaps}
                weeklyHours={weeklyHours}
                highlightedSkill={highlightedSkill}
                onOpenResource={onOpenResource}
                isChanged={changedPhases.includes(phase.phase_number)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

