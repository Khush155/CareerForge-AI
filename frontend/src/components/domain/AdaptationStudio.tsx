import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { ShieldCheck, Zap, Sparkles, Terminal, ArrowRight, RefreshCw, Award } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

interface AdaptationStudioProps {
  onApplyScore: (skill: string, score: number) => Promise<void>;
}

export const AdaptationStudio: React.FC<AdaptationStudioProps> = ({ onApplyScore }) => {
  const { profile, roadmap, skills } = useAppStore();

  const [selectedSkill, setSelectedSkill] = useState<string>(skills[0]?.name || 'SQL');
  const [score, setScore] = useState<number>(85);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const activeSkillObj = skills.find((s) => s.name === selectedSkill) || skills[0];
  const currentLevel = activeSkillObj ? activeSkillObj.proficiency : 1.5;

  const baseJump = 2.0;
  const gain = Math.round(baseJump * (score / 100) * 100) / 100;
  const projectedLevel = Math.min(5.0, Math.round((currentLevel + gain) * 100) / 100);

  // SVG circular radar
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleExecute = async () => {
    if (!profile) {
      alert('Please forge a roadmap first before executing recalibration.');
      return;
    }
    try {
      setIsApplying(true);
      await onApplyScore(selectedSkill, score);
    } finally {
      setIsApplying(false);
    }
  };

  if (!roadmap) {
    return (
      <section id="recalibration-section" className="glass-panel rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 border border-[var(--border-default)]">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-quiet)] border border-[var(--border-default)] flex items-center justify-center text-[var(--neon-cyan)]">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-[var(--text-primary)] font-sans">
          Adaptive Recalibration Studio
        </h3>
        <p className="text-xs text-[var(--text-muted)] max-w-md">
          Once your initial roadmap is forged, test your skills or log quiz scores here to watch the closed-loop engine dynamically restructure your remaining study phases in real-time.
        </p>
      </section>
    );
  }

  return (
    <section id="recalibration-section" aria-labelledby="studio-heading" className="glass-panel rounded-3xl p-6 sm:p-8 border border-[var(--border-default)] shadow-xl flex flex-col gap-6 relative overflow-hidden">
      {/* Top Laser Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-indigo)] to-[var(--neon-violet)]" />

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-2 pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 flex items-center justify-center text-[var(--neon-cyan)]">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h2 id="studio-heading" className="text-lg font-bold text-[var(--text-primary)] font-sans">
              Live Skill Recalibration Studio
            </h2>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Closed-loop feedback engine · Test mastery & adapt remaining timeline
            </span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[var(--neon-emerald)]/10 border border-[var(--neon-emerald)]/30 font-mono text-xs font-bold text-[var(--neon-emerald)] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Deterministic Reversioning
        </span>
      </div>

      <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 max-lg:grid-cols-1 items-center">
        {/* Left Column: Interactive Controls */}
        <div className="flex flex-col gap-5">
          {/* Skill Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="studio-skill-select" className="text-xs font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              1. Select Domain Evaluated in Quiz / Project:
            </label>
            <select
              id="studio-skill-select"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="h-10 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors cursor-pointer"
            >
              {skills.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} (Current: {s.proficiency.toFixed(1)} / 5.0)
                </option>
              ))}
            </select>
          </div>

          {/* Performance Slider & Gauge */}
          <div className="flex flex-col gap-3 bg-[var(--bg-sunken)]/60 border border-[var(--border-subtle)] rounded-2xl p-4">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[var(--text-secondary)]">2. Quiz Assessment Performance</span>
              <span className="text-[var(--neon-cyan)] font-bold">{score}% Mastery</span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-2.5 bg-[var(--bg-surface)] rounded-full accent-[var(--neon-cyan)] cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>0% (Needs Remediation)</span>
              <span>50%</span>
              <span>100% (Full Mastery)</span>
            </div>
          </div>

          {/* Recalibrate CTA */}
          <button
            type="button"
            onClick={handleExecute}
            disabled={isApplying}
            className="h-11 px-6 rounded-xl font-mono font-bold text-sm text-white cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 shadow-lg bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-indigo)] to-[var(--neon-violet)] hover:opacity-95"
          >
            {isApplying ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Recalibrating Trajectory...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Recalibrate & Adapt Roadmap to Revision v{(roadmap?.version || 1) + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Right Column: Circular Radar & Formula Terminal */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[130px_1fr] gap-4 items-center bg-[var(--bg-sunken)] p-4 rounded-2xl border border-[var(--border-subtle)]">
            {/* Circular Gauge */}
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
                  stroke="url(#studio-gauge-gradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="studio-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--neon-cyan)" />
                    <stop offset="100%" stopColor="var(--neon-emerald)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{score}%</span>
                <span className="text-[9px] text-[var(--text-muted)] uppercase">Score</span>
              </div>
            </div>

            {/* Projected Jump Metric */}
            <div className="flex flex-col gap-1 font-mono text-xs">
              <span className="text-[var(--text-muted)] flex items-center gap-1">
                <Award className="w-3 h-3 text-[var(--neon-emerald)]" /> Projected Level:
              </span>
              <div className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>{currentLevel.toFixed(1)}</span>
                <span className="text-[var(--neon-cyan)]">→</span>
                <span className="text-[var(--neon-emerald)]">
                  <AnimatedNumber value={projectedLevel} decimals={2} /> / 5.00
                </span>
              </div>
              <span className="text-[var(--neon-emerald)] text-[11px] font-semibold">
                +{gain.toFixed(2)} pts gain computed
              </span>
            </div>
          </div>

          {/* Cyber Formula Terminal */}
          <div className="bg-[var(--bg-sunken)] border border-[var(--border-subtle)] rounded-2xl p-3.5 font-mono text-xs leading-relaxed">
            <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-[11px]">
              <Terminal className="w-3 h-3 text-[var(--neon-cyan)]" />
              <span>DETERMINISTIC FORMULA ENGINE</span>
            </div>
            <div className="text-[var(--text-muted)] space-y-0.5 text-[11px]">
              <div>&gt; gain = base_jump × (score / 100)</div>
              <div>
                &gt;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {baseJump.toFixed(1)} × ({score} / 100) ={' '}
                <span className="text-[var(--neon-emerald)] font-bold">+{gain.toFixed(2)} pts</span>
              </div>
              <div className="text-[var(--text-secondary)] pt-1">
                &gt; Action: Restructures next phase to eliminate mastered topics & reduce hours.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
