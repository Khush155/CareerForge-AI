import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';
import type { Skill } from '../../lib/schemas';
import { formatLevel } from '../../lib/format';
import { SkillSelectDropdown, type SelectableSkillItem } from './SkillSelectDropdown';

export interface AssessmentDialogProps {
  isOpen: boolean;
  skills: Skill[];
  defaultSkill?: string;
  onClose: () => void;
  onApplyScore: (skill: string, score: number) => Promise<void>;
}

const SCORE_PRESETS = [
  { label: 'Novice (25%)', val: 25 },
  { label: 'Competent (50%)', val: 50 },
  { label: 'Proficient (75%)', val: 75 },
  { label: 'Advanced (90%)', val: 90 },
  { label: 'Mastery (100%)', val: 100 },
];

export const AssessmentDialog: React.FC<AssessmentDialogProps> = ({
  isOpen,
  skills,
  defaultSkill,
  onClose,
  onApplyScore,
}) => {
  const selectableItems = useMemo<SelectableSkillItem[]>(() => {
    return skills.map((s) => ({
      name: s.name,
      proficiency: s.proficiency,
      source: 'Competency',
      category: 'gap' as const,
    }));
  }, [skills]);

  const [selectedSkill, setSelectedSkill] = useState(defaultSkill || skills[0]?.name || 'SQL');
  const [score, setScore] = useState(85);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultSkill) setSelectedSkill(defaultSkill);
    else if (skills[0]) setSelectedSkill(skills[0].name);
  }, [defaultSkill, skills]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeSkillObj = skills.find((s) => s.name === selectedSkill) || skills[0];
  const currentLevel = activeSkillObj ? activeSkillObj.proficiency : 1.5;

  // Exact 100% deterministic formula matching backend progress_engine.py
  const targetScoreLevel = (score / 100.0) * 5.0;
  const rawNewLevel = currentLevel * 0.4 + targetScoreLevel * 0.6;
  const projectedLevel = Math.max(0.0, Math.min(5.0, Math.round(rawNewLevel * 10) / 10));
  const levelDelta = Math.round((projectedLevel - currentLevel) * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onApplyScore(selectedSkill, score);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-[var(--bg)]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-dialog-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-[560px] max-w-full bg-[var(--bg-elev-1)] border border-[var(--border-strong)] rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col gap-6 relative overflow-visible"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="flex justify-between items-start pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--accent-amber)]" />
              </div>
              <div>
                <h3 id="assessment-dialog-title" className="text-lg font-bold font-display text-[var(--text)]">
                  Diagnostic Skill Evaluation
                </h3>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Deterministic recalibration · Real-time roadmap adaptation
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Skill Selector */}
            <div className="space-y-2">
              <label htmlFor="eval-skill-select" className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Target Skill Domain:
              </label>
              <SkillSelectDropdown
                id="eval-skill-select"
                skills={selectableItems}
                selectedSkill={selectedSkill}
                onSelect={(name) => setSelectedSkill(name)}
              />
            </div>

            {/* 2. Interactive Score Slider & Presets */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Assessment Score:
                </span>
                <span className="font-bold text-base text-[var(--accent-indigo)] font-display">
                  {score}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-[var(--bg-elev-3)] appearance-none cursor-pointer accent-[var(--accent-indigo)]"
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SCORE_PRESETS.map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setScore(preset.val)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer border ${
                      score === preset.val
                        ? 'bg-[var(--accent-indigo)] text-white border-[var(--accent-indigo)] shadow-sm'
                        : 'bg-[var(--bg-elev-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Live Projected Gain Gauge */}
            <div className="p-4 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
                  <span>Projected Jump</span>
                </div>

                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-xl font-bold text-[var(--text)]">
                    {formatLevel(currentLevel)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-sky)]" />
                  <span className="text-2xl font-bold text-[var(--color-mastered)]">
                    {formatLevel(projectedLevel)}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-mastered)] bg-[var(--color-mastered)]/10 px-2 py-0.5 rounded-full">
                    +{formatLevel(levelDelta)} pts
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-faint)] font-body">
                  Deterministic formula: <code className="font-mono text-[10px]">New = Current×0.4 + (Score/20)×0.6</code>
                </p>
              </div>

              {/* Mini Circular Ring */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg width={64} height={64} className="transform -rotate-90">
                  <circle
                    cx={32}
                    cy={32}
                    r={26}
                    stroke="var(--bg-elev-3)"
                    strokeWidth={5}
                    fill="transparent"
                  />
                  <circle
                    cx={32}
                    cy={32}
                    r={26}
                    stroke="var(--color-mastered)"
                    strokeWidth={5}
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 - (score / 100) * (2 * Math.PI * 26)}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-[var(--text)]">
                  {score}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-indigo)] to-[var(--accent-violet)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recalculating Curriculum...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
                    <span>Apply & Adapt Roadmap</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
