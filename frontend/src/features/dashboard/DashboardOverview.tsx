import React, { useMemo } from 'react';
import { PageHeader } from '../../components/layout/AppShell';
import { ReadinessRing } from './ReadinessRing';
import { StatCards } from './StatCards';
import { WeeklyPlan } from './WeeklyPlan';
import { SkillRadarChart } from '../../components/domain/SkillRadarChart';
import { GapMatrix } from '../../components/domain/GapMatrix';
import { useAppStore } from '../../lib/store';
import {
  Sparkles,
  ArrowRight,
  Search,
  Compass,
} from 'lucide-react';

interface DashboardOverviewProps {
  onOpenAssessment: (skill?: string) => void;
  onOpenEvidence: (skill: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onOpenAssessment,
  onOpenEvidence,
}) => {
  const {
    profile,
    roadmap,
    gaps,
    setCurrentSection,
  } = useAppStore();

  // Calculate true readiness score: sum(min(cur, req)) / sum(req) * 100
  const readinessScore = useMemo(() => {
    if (!gaps || gaps.length === 0) return 0;
    const totalRequired = gaps.reduce((acc, g) => acc + g.required_level, 0);
    if (totalRequired === 0) return 100;
    const totalAchieved = gaps.reduce(
      (acc, g) => acc + Math.min(g.current_level, g.required_level),
      0
    );
    return Math.round((totalAchieved / totalRequired) * 100);
  }, [gaps]);

  const activeGapsCount = gaps.filter((g) => g.gap > 0).length;

  return (
    <div className="space-y-8">
      {/* Dashboard Executive Header */}
      <PageHeader
        title={profile ? `Mission Control · ${profile.name}` : 'Mission Control Dashboard'}
        subtitle={
          profile
            ? `Target Career: ${profile.target_role} · ${roadmap ? `${roadmap.total_estimated_hours}h estimated effort (${roadmap.available_hours_per_week}h/week)` : 'Telemetry loading...'}`
            : 'Configure your career goal or load demo student telemetry to view live analytics.'
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAssessment()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent-indigo)] text-white text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>Log Assessment</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentSection('home')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[var(--accent-sky)]" />
              <span>Switch Goal</span>
            </button>
          </div>
        }
      />

      {/* When profile is active */}
      {profile ? (
        <>
          {/* Top Telemetry Row: Readiness Ring + Stat Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Readiness Ring (4 cols on lg) */}
            <div className="lg:col-span-4 flex">
              <div className="w-full">
                <ReadinessRing
                  score={readinessScore}
                  label="Placement Readiness"
                  sublabel={`Based on ${gaps.length} verified benchmark competencies`}
                />
              </div>
            </div>

            {/* Stat Cards (8 cols on lg) */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <StatCards
                profile={profile}
                roadmap={roadmap}
                gaps={gaps}
                readinessScore={readinessScore}
              />
            </div>
          </div>

          {/* Middle Row: Active Sprint Weekly Plan + Radar Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Weekly Plan (7 cols on lg) */}
            <div className="lg:col-span-7">
              <WeeklyPlan
                roadmap={roadmap}
                gaps={gaps}
                onOpenAssessment={() => onOpenAssessment()}
                onNavigateRoadmap={() => setCurrentSection('roadmap')}
                onOpenResource={(skill) => onOpenEvidence(skill)}
              />
            </div>

            {/* Competency Radar (5 cols on lg) */}
            <div className="lg:col-span-5">
              <SkillRadarChart gaps={gaps} maxDisplay={7} height={320} />
            </div>
          </div>

          {/* Bottom Row: High Priority Gaps Matrix Preview */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--text)]">
                  Skill Gap Matrix ({activeGapsCount} Active Gaps)
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-body">
                  Compare your self-reported level against industry benchmarks. Click any guide to view citations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentSection('gaps')}
                className="text-xs font-semibold text-[var(--accent-indigo)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <GapMatrix
              gaps={gaps}
              onSelectSkill={onOpenEvidence}
              onOpenAssessment={onOpenAssessment}
              initialView="table"
            />
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-[var(--bg-elev-1)] border border-dashed border-[var(--border-strong)] text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] flex items-center justify-center mx-auto shadow-inner">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-display text-[var(--text)]">
            No Student Profile Configured
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            Search any dream job from the Home screen to configure your personal profile, calibrate your benchmark requirements, and generate your adaptive execution roadmap.
          </p>
          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentSection('home')}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-indigo)] text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-md"
            >
              Configure Dream Job & Plan →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
