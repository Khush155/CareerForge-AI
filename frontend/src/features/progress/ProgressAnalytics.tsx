import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../../lib/store';
import { formatLevel } from '../../lib/format';
import {
  CheckCircle2,
  Award,
  Zap,
  ShieldCheck,
  ArrowRight,
  Flame,
  Square,
  BarChart3,
  Loader2,
  Check,
} from 'lucide-react';
import { fetchCompletedMilestones, updateMilestoneCompletion } from '../../lib/api';
import { toast } from 'sonner';

export const ProgressAnalytics: React.FC = () => {
  const { profile, roadmap, gaps } = useAppStore();
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  // Load completed milestones from backend SQLite store
  useEffect(() => {
    if (!profile?.id) return;
    setLoadingMilestones(true);
    fetchCompletedMilestones(profile.id)
      .then((data) => setCompletedMap(data))
      .catch((err) => console.warn('Could not fetch milestones:', err))
      .finally(() => setLoadingMilestones(false));
  }, [profile?.id]);

  // Deterministic Overall Readiness Calculation
  const readinessMetrics = useMemo(() => {
    if (!gaps || gaps.length === 0) {
      return { percentage: 0, totalCurrent: 0, totalRequired: 0 };
    }
    const totalRequired = gaps.reduce((acc, g) => acc + g.required_level, 0);
    const totalCurrent = gaps.reduce(
      (acc, g) => acc + Math.min(g.current_level, g.required_level),
      0
    );
    const percentage = totalRequired > 0 ? Math.round((totalCurrent / totalRequired) * 100) : 0;
    return {
      percentage: Math.min(100, Math.max(0, percentage)),
      totalCurrent: Math.round(totalCurrent * 10) / 10,
      totalRequired: Math.round(totalRequired * 10) / 10,
    };
  }, [gaps]);

  // All milestones across phases (using phase.learning_objectives matching RoadmapBoard)
  const allMilestones = useMemo(() => {
    if (!roadmap?.phases) return [];
    const list: { phaseNum: number; phaseTitle: string; milestone: string; key: string }[] = [];
    roadmap.phases.forEach((p) => {
      (p.learning_objectives || []).forEach((m, idx) => {
        list.push({
          phaseNum: p.phase_number,
          phaseTitle: p.title,
          milestone: m,
          key: `${p.phase_number}-${idx}`,
        });
      });
    });
    return list;
  }, [roadmap]);

  const totalMilestonesCount = allMilestones.length;
  const completedMilestonesCount = allMilestones.filter((m) => !!completedMap[m.key]).length;
  const milestoneProgressPct =
    totalMilestonesCount > 0
      ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
      : 0;

  // Velocity Metrics
  const weeklyHours = roadmap?.available_hours_per_week || 20;
  const totalHours = roadmap?.total_estimated_hours || 0;
  const completionRatio = totalMilestonesCount > 0 ? completedMilestonesCount / totalMilestonesCount : 0;
  const remainingHours = Math.max(0, Math.round(totalHours * (1 - completionRatio)));
  const estimatedWeeksLeft = weeklyHours > 0 ? (remainingHours / weeklyHours).toFixed(1) : '0';

  const handleToggleMilestone = async (key: string) => {
    if (!profile?.id) return;
    const currentVal = !!completedMap[key];
    const newVal = !currentVal;

    // Optimistic update
    setCompletedMap((prev) => ({ ...prev, [key]: newVal }));

    try {
      await updateMilestoneCompletion(profile.id, key, newVal);
      toast.success(newVal ? 'Milestone marked completed!' : 'Milestone reopened.');
    } catch {
      // Revert on error
      setCompletedMap((prev) => ({ ...prev, [key]: currentVal }));
      toast.error('Failed to update milestone status on server.');
    }
  };

  // Circular gauge for readiness
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (readinessMetrics.percentage / 100) * circumference;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Overall Job Readiness Gauge Card */}
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-elev-1)] flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[var(--accent-mint)]" />
              Job Readiness Score
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30 font-bold">
              Deterministic
            </span>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="var(--border)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="url(#readiness-gauge-grad)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="readiness-gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-sky)" />
                    <stop offset="100%" stopColor="var(--accent-mint)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                <span className="text-3xl font-black text-[var(--text)] tracking-tight">
                  {readinessMetrics.percentage}%
                </span>
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-sans font-medium">
                  Readiness
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-[var(--text-muted)] flex justify-between items-center border-t border-[var(--border)] pt-3">
            <span>Points: {readinessMetrics.totalCurrent} / {readinessMetrics.totalRequired}</span>
            <span className="text-[var(--accent-mint)] font-bold">
              {readinessMetrics.percentage >= 80 ? 'Market Ready' : 'In Calibration'}
            </span>
          </div>
        </div>

        {/* 2. Velocity & Time-to-Readiness */}
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-elev-1)] flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Velocity & Runway
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              Sprint Pace
            </span>
          </div>

          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-[var(--text)] tracking-tight">
                  {estimatedWeeksLeft}
                </span>
                <span className="text-sm font-sans text-[var(--text-muted)]">weeks remaining</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                At dedicated capacity of <strong className="text-[var(--text)]">{weeklyHours} hrs/week</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                  Remaining Hours
                </span>
                <span className="text-base font-bold font-mono text-[var(--accent-sky)]">
                  {remainingHours} hrs
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                  Velocity Index
                </span>
                <span className="text-base font-bold font-mono text-[var(--accent-mint)]">
                  1.15x Pace
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-[var(--text-muted)] flex justify-between items-center border-t border-[var(--border)] pt-3">
            <span>Milestones: {completedMilestonesCount} / {totalMilestonesCount}</span>
            <span className="text-[var(--accent-sky)] font-bold">{milestoneProgressPct}% Done</span>
          </div>
        </div>

        {/* 3. Phased Roadmap Health */}
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-elev-1)] flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[var(--accent-purple)]" />
              Dynamic Revision Engine
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 font-bold">
              v{roadmap?.version.toFixed(1) || '1.0'}
            </span>
          </div>

          <div className="space-y-3 py-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-[var(--text)] tracking-tight">
                {roadmap?.phases.length || 0}
              </span>
              <span className="text-sm font-sans text-[var(--text-muted)]">Active Phases</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Every quiz assessment triggers deterministic recalculation, removing mastered requirements and shrinking timeline runway.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
              Target Role:
            </span>
            <span className="font-bold text-[var(--text)] truncate max-w-[160px]">
              {profile?.target_role || 'Software Engineer'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Milestones Completion Checklist */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-elev-1)] space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-3 pb-3 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-display text-[var(--text)]">
                Milestone Execution Progress
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Live checklist synchronized with your active profile. Click items to update completion status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {loadingMilestones && (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-mint)]" />
            )}
            <div className="w-36 h-2 rounded-full bg-[var(--bg-elev-2)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-sky)] to-[var(--accent-mint)] transition-all duration-500"
                style={{ width: `${milestoneProgressPct}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-[var(--accent-mint)]">
              {completedMilestonesCount} / {totalMilestonesCount}
            </span>
          </div>
        </div>

        {allMilestones.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
            No milestones found. Generate or load a roadmap first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allMilestones.map((item) => {
              const isDone = !!completedMap[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggleMilestone(item.key)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer select-none ${
                    isDone
                      ? 'bg-[var(--accent-mint)]/5 border-[var(--accent-mint)]/30 hover:border-[var(--accent-mint)]/50'
                      : 'bg-[var(--bg-elev-2)] border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {isDone ? (
                      <div className="w-4 h-4 rounded bg-[var(--accent-mint)] flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3] text-black dark:text-white" style={{ color: 'var(--milestone-tick-color)' }} />
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text)]" />
                    )}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-elev-1)] text-[var(--text-muted)] border border-[var(--border)] font-semibold">
                        Phase {item.phaseNum}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                        {item.phaseTitle}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-sans leading-relaxed ${
                        isDone
                          ? 'line-through text-[var(--text-muted)]'
                          : 'text-[var(--text)] font-medium'
                      }`}
                    >
                      {item.milestone}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Skill Progression Breakdown */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-elev-1)] space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-sky)]/10 text-[var(--accent-sky)] flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text)]">
              Skill Trajectory & Benchmark Fulfillment
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Real-time progress of individual skills toward market-clearing benchmark levels
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {gaps.map((g) => {
            const skillPct = Math.min(100, Math.round((g.current_level / g.required_level) * 100));
            return (
              <div
                key={g.skill}
                className="p-4 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="sm:w-48 shrink-0">
                  <div className="text-sm font-bold font-sans text-[var(--text)]">{g.skill}</div>
                  <div className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                    <span>{formatLevel(g.current_level)}</span>
                    <ArrowRight className="w-3 h-3 text-[var(--accent-sky)]" />
                    <span className="font-semibold text-[var(--text)]">{formatLevel(g.required_level)}</span>
                    <span>req</span>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1 h-2 rounded-full bg-[var(--bg-elev-1)] overflow-hidden border border-[var(--border)]">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent-sky)] to-[var(--accent-mint)] transition-all duration-500 rounded-full"
                      style={{ width: `${skillPct}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--text)] w-12 text-right">
                    {skillPct}%
                  </span>
                </div>

                <div className="sm:w-28 text-right shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                      g.gap === 0
                        ? 'bg-[var(--accent-mint)]/15 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {g.gap === 0 ? 'Mastered' : `-${formatLevel(g.gap)} gap`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
