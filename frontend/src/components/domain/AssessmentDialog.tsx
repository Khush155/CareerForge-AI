import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Zap, Terminal, Sparkles } from 'lucide-react';
import type { Skill } from '../../lib/schemas';
import { AnimatedNumber } from './AnimatedNumber';

export interface AssessmentDialogProps {
  isOpen: boolean;
  skills: Skill[];
  defaultSkill?: string;
  onClose: () => void;
  onApplyScore: (skill: string, score: number) => Promise<void>;
}

export const AssessmentDialog: React.FC<AssessmentDialogProps> = ({
  isOpen,
  skills,
  defaultSkill,
  onClose,
  onApplyScore,
}) => {
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

  const baseJump = 2.0;
  const gain = Math.round(baseJump * (score / 100) * 100) / 100;
  const projectedLevel = Math.min(5.0, Math.round((currentLevel + gain) * 100) / 100);

  // SVG Circular Gauge calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

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
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-[580px] max-w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl shadow-[var(--shadow-overlay)] p-6 flex flex-col gap-5 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Cyber Neon Header Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-indigo)] to-[var(--neon-violet)]" />

          {/* Modal Header */}
          <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 flex items-center justify-center text-[var(--neon-cyan)]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 id="dialog-title" className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  Diagnostic Skill Recalibration
                </h2>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Live closed-loop adaptation chamber
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] flex items-center justify-center text-sm cursor-pointer transition-colors"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Skill Selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="modal-skill-select" className="text-xs font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Assessed Skill Domain
              </label>
              <select
                id="modal-skill-select"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="h-10 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors cursor-pointer"
              >
                {skills.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} — Current: {s.proficiency.toFixed(1)} / 5.0
                  </option>
                ))}
              </select>
            </div>

            {/* Circular Radar & Score Slider Grid */}
            <div className="grid grid-cols-[130px_1fr] gap-5 items-center bg-[var(--bg-sunken)]/60 border border-[var(--border-subtle)] rounded-2xl p-4">
              {/* Circular Gauge Graphic */}
              <div className="relative w-[110px] h-[110px] mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 110 110">
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke="var(--border-default)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke="url(#modal-gauge-gradient)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300 ease-out"
                  />
                  <defs>
                    <linearGradient id="modal-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--neon-cyan)" />
                      <stop offset="100%" stopColor="var(--neon-emerald)" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-xl font-bold text-[var(--text-primary)] tabular-nums">
                    {score}%
                  </span>
                  <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase">
                    Score
                  </span>
                </div>
              </div>

              {/* Slider & Input Controls */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[var(--text-secondary)]">Assessment Performance</span>
                  <span className="text-[var(--neon-cyan)] font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Real-time preview
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--bg-sunken)] rounded-full accent-[var(--neon-cyan)] cursor-pointer"
                />
                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-mono">
                  <span>0% (Fail)</span>
                  <span>50%</span>
                  <span>100% (Perfect)</span>
                </div>
              </div>
            </div>

            {/* Cyber Terminal Readout */}
            <div className="bg-[var(--bg-sunken)] border border-[var(--border-subtle)] rounded-2xl p-3.5 font-mono text-xs leading-relaxed relative overflow-hidden">
              <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-[11px]">
                <Terminal className="w-3 h-3 text-[var(--neon-cyan)]" />
                <span>FORMULA ENGINE EXECUTION</span>
              </div>
              <div className="text-[var(--text-muted)] space-y-0.5">
                <div>&gt; gain = base_jump × (score / 100)</div>
                <div>
                  &gt;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {baseJump.toFixed(1)} × ({score} / 100) ={' '}
                  <span className="text-[var(--neon-emerald)] font-bold">+{gain.toFixed(2)} pts</span>
                </div>
              </div>
              <div className="text-[var(--text-primary)] mt-3 pt-2 border-t border-[var(--border-subtle)] flex justify-between items-center text-sm font-semibold">
                <span className="flex items-center gap-1.5">
                  <span>{selectedSkill} Level:</span>
                </span>
                <span className="inline-flex items-center gap-2 font-mono">
                  <span className="text-[var(--text-secondary)]">{currentLevel.toFixed(1)}</span>
                  <span className="text-[var(--neon-cyan)]">→</span>
                  <span className="text-[var(--neon-emerald)]">
                    <AnimatedNumber value={projectedLevel} decimals={2} /> / 5.00
                  </span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 border border-[var(--border-default)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-indigo)] to-[var(--neon-violet)] hover:opacity-95 text-white font-semibold rounded-xl text-sm cursor-pointer shadow-[0_0_20px_rgba(0,242,254,0.35)] flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Recalibrating Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Recalibrate & Adapt Roadmap</span>
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
