import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import type { Roadmap, SkillGap, StudentProfile } from '../../lib/schemas';

interface StatCardsProps {
  profile: StudentProfile | null;
  roadmap: Roadmap | null;
  gaps: SkillGap[];
  readinessScore: number;
}

const useAnimatedCount = (target: number, duration: number = 1000) => {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(target);
    if (end === 0) {
      setVal(0);
      return;
    }
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + (end - start) * ease));
      if (p < 1) requestAnimationFrame(update);
    };

    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);

  return val;
};

export const StatCards: React.FC<StatCardsProps> = ({
  profile,
  roadmap,
  gaps,
  readinessScore,
}) => {
  const animatedReadiness = useAnimatedCount(readinessScore);
  const animatedHours = useAnimatedCount(roadmap?.total_estimated_hours || 0);
  const animatedWeeks = useAnimatedCount(roadmap?.estimated_weeks || 0);

  const criticalGapsCount = gaps.filter((g) => g.priority === 'High').length;
  const masteredSkillsCount = gaps.filter((g) => g.gap === 0 || g.priority === 'Mastered').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Readiness Index */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="p-5 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono mb-2">
            <span className="uppercase tracking-wider">Readiness Score</span>
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[var(--text)]">
              {animatedReadiness}%
            </span>
            <span className="text-xs font-mono font-semibold text-[var(--accent-mint)] flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              Tier 1
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 truncate" title={profile?.target_role || 'Target Role'}>
            Target: <strong className="text-[var(--text)]">{profile?.target_role || 'Target Role'}</strong>
          </p>
        </div>

        {/* Mini progress track */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-elev-3)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-indigo)] to-[var(--accent-mint)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, readinessScore)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-faint)] mt-1.5">
            <span>Intake Baseline</span>
            <span>Placement Standard</span>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Total Study Investment */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="p-5 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono mb-2">
            <span className="uppercase tracking-wider">Total Effort</span>
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-display text-[var(--text)]">
              {animatedHours}
            </span>
            <span className="text-sm font-normal text-[var(--text-muted)] font-body">hours</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-body">
            Across {roadmap?.phases.length || 0} phased execution sprints
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-xs font-mono text-[var(--text-muted)]">Paced velocity</span>
          <span className="text-xs font-mono font-semibold text-[var(--accent-amber)] bg-[var(--accent-amber)]/10 px-2 py-0.5 rounded-full">
            {roadmap?.available_hours_per_week || 20} hrs / wk
          </span>
        </div>
      </motion.div>

      {/* Card 3: Time to Placement */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="p-5 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono mb-2">
            <span className="uppercase tracking-wider">Time to Ready</span>
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-sky)]/10 text-[var(--accent-sky)] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-display text-[var(--text)]">
              ≈ {animatedWeeks}
            </span>
            <span className="text-sm font-normal text-[var(--text-muted)] font-body">weeks</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-body">
            Target placement readiness timeline
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-xs font-mono text-[var(--text-muted)]">Pacing Status</span>
          <span className="text-xs font-mono font-semibold text-[var(--accent-mint)] bg-[var(--accent-mint)]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            On Schedule
          </span>
        </div>
      </motion.div>

      {/* Card 4: Active Priority Gaps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="p-5 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono mb-2">
            <span className="uppercase tracking-wider">Priority Gaps</span>
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-coral)]/10 text-[var(--accent-coral)] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[var(--text)]">
              {criticalGapsCount}
            </span>
            <span className="text-xs font-mono text-[var(--accent-coral)] font-semibold uppercase">
              Critical
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-body">
            {masteredSkillsCount} skill{masteredSkillsCount !== 1 ? 's' : ''} already benchmarked
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-xs font-mono text-[var(--text-muted)]">Action Priority</span>
          <span className="text-xs font-mono font-semibold text-[var(--accent-coral)] bg-[var(--accent-coral)]/10 px-2 py-0.5 rounded-full">
            Immediate Sprint
          </span>
        </div>
      </motion.div>
    </div>
  );
};
