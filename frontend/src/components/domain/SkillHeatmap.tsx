import React from 'react';
import { motion } from 'motion/react';
import type { SkillGap } from '../../lib/schemas';
import { formatLevel } from '../../lib/format';
import { BookOpen, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SkillHeatmapProps {
  gaps: SkillGap[];
  onSelectSkill: (skill: string) => void;
}

export const SkillHeatmap: React.FC<SkillHeatmapProps> = ({ gaps, onSelectSkill }) => {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-elev-1)] rounded-3xl border border-[var(--border)]">
        No skill domains to display in heatmap.
      </div>
    );
  }

  const getHeatmapColor = (gap: SkillGap) => {
    if (gap.gap === 0 || gap.priority === 'Mastered') {
      return {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.25)',
        text: 'var(--color-mastered)',
        label: 'Mastered',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-mastered)]" />,
      };
    }
    if (gap.priority === 'High' || gap.gap >= 2.0) {
      return {
        bg: 'rgba(244, 63, 94, 0.1)',
        border: 'rgba(244, 63, 94, 0.28)',
        text: 'var(--accent-coral)',
        label: 'Critical Gap',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-coral)]" />,
      };
    }
    if (gap.priority === 'Medium' || gap.gap >= 1.0) {
      return {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.28)',
        text: 'var(--accent-amber)',
        label: 'Moderate Gap',
        icon: <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />,
      };
    }
    return {
      bg: 'rgba(56, 189, 248, 0.1)',
      border: 'rgba(56, 189, 248, 0.25)',
      text: 'var(--accent-sky)',
      label: 'Minor Gap',
      icon: <Sparkles className="w-3.5 h-3.5 text-[var(--accent-sky)]" />,
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
      {gaps.map((g, idx) => {
        const theme = getHeatmapColor(g);
        const completionPct = Math.min(100, Math.round((g.current_level / (g.required_level || 1)) * 100));

        return (
          <motion.div
            key={g.skill}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            onClick={() => onSelectSkill(g.skill)}
            className="group relative p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] shadow-sm flex flex-col justify-between"
            style={{ backgroundColor: theme.bg, borderColor: theme.border }}
          >
            {/* Top row: Skill name + Status Icon */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h5 className="text-sm font-bold font-display text-[var(--text)] group-hover:text-[var(--accent-indigo)] transition-colors line-clamp-1">
                  {g.skill}
                </h5>
                <span className="shrink-0">{theme.icon}</span>
              </div>

              {/* Status pill & demand */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span
                  className="px-1.5 py-0.5 rounded font-semibold uppercase"
                  style={{ color: theme.text, backgroundColor: 'var(--bg-elev-1)' }}
                >
                  {theme.label}
                </span>
                <span className="text-[var(--text-faint)]">
                  {g.demand_level} demand
                </span>
              </div>
            </div>

            {/* Bottom row: Levels and Mini bar */}
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-muted)]">
                  {formatLevel(g.current_level)} / {formatLevel(g.required_level)}
                </span>
                <span className="font-bold" style={{ color: theme.text }}>
                  {g.gap === 0 ? 'Goal Met' : `-${formatLevel(g.gap)} pts`}
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-elev-3)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${completionPct}%`,
                    backgroundColor: theme.text,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-[var(--text-faint)] pt-1">
                <span>{completionPct}% Ready</span>
                <span className="group-hover:text-[var(--accent-indigo)] transition-colors flex items-center gap-1">
                  <BookOpen className="w-2.5 h-2.5" /> Guide
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
