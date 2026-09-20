import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Terminal,
  ArrowRight,
  RefreshCw,
  Award,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { AssessmentHistory } from '../../features/assess/AssessmentHistory';
import { formatLevel } from '../../lib/format';

interface AdaptationStudioProps {
  onApplyScore: (skill: string, score: number) => Promise<void>;
}

const SCORE_PRESETS = [
  { label: 'Novice (25%)', val: 25 },
  { label: 'Competent (50%)', val: 50 },
  { label: 'Proficient (75%)', val: 75 },
  { label: 'Advanced (85%)', val: 85 },
  { label: 'Mastery (100%)', val: 100 },
];

export const AdaptationStudio: React.FC<AdaptationStudioProps> = ({ onApplyScore }) => {
  const { profile, roadmap, skills } = useAppStore();

  const [selectedSkill, setSelectedSkill] = useState<string>(skills[0]?.name || 'SQL');
  const [score, setScore] = useState<number>(85);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [historyRefresh, setHistoryRefresh] = useState<number>(0);

  const activeSkillObj = skills.find((s) => s.name === selectedSkill) || skills[0];
  const currentLevel = activeSkillObj ? activeSkillObj.proficiency : 1.5;

  // Exact 100% deterministic formula matching backend progress_engine.py
  const targetScoreLevel = (score / 100.0) * 5.0;
  const rawNewLevel = currentLevel * 0.4 + targetScoreLevel * 0.6;
  const projectedLevel = Math.max(0.0, Math.min(5.0, Math.round(rawNewLevel * 10) / 10));
  const levelDelta = Math.round((projectedLevel - currentLevel) * 10) / 10;
  const estimatedHoursSaved = Math.max(0, Math.round(levelDelta * 12));

  // SVG circular gauge
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
      setHistoryRefresh((prev) => prev + 1);
    } finally {
      setIsApplying(false);
    }
  };

  if (!roadmap) {
    return (
      <section
        id="recalibration-section"
        className="glass-panel rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 border border-[var(--border)]"
      >
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 flex items-center justify-center text-[var(--accent-mint)]">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-[var(--text)] font-sans">
          Adaptive Recalibration Studio
        </h3>
        <p className="text-xs text-[var(--text-muted)] max-w-md">
          Once your initial roadmap is forged, test your skills or log quiz scores here to watch the closed-loop engine dynamically restructure your remaining study phases in real time.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section
        id="recalibration-section"
        aria-labelledby="studio-heading"
        className="glass-panel rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-xl flex flex-col gap-6 relative overflow-hidden bg-[var(--bg-elev-1)]"
      >
        {/* Top Laser Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-sky)] via-[var(--accent-mint)] to-[var(--accent-purple)]" />

        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-2 pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 flex items-center justify-center text-[var(--accent-mint)]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 id="studio-heading" className="text-lg font-bold text-[var(--text)] font-display">
                Live Skill Recalibration Studio
              </h2>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Closed-loop feedback engine · Test mastery & adapt remaining timeline
              </span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 font-mono text-xs font-bold text-[var(--accent-mint)] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Deterministic Math (0.4 / 0.6)
          </span>
        </div>

        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 max-lg:grid-cols-1 items-start">
          {/* Left Column: Interactive Controls */}
          <div className="flex flex-col gap-5">
            {/* Skill Selector */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="studio-skill-select"
                className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider"
              >
                1. Select Domain Evaluated in Quiz / Project:
              </label>
              <select
                id="studio-skill-select"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="h-11 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-xl px-3 text-sm text-[var(--text)] focus:border-[var(--accent-sky)] outline-none transition-colors cursor-pointer font-sans"
              >
                {skills.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} (Current: {formatLevel(s.proficiency)} / 5.0)
                  </option>
                ))}
              </select>
            </div>

            {/* Performance Slider & Quick Presets */}
            <div className="flex flex-col gap-3 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-2xl p-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-muted)]">2. Quiz Assessment Performance</span>
                <span className="text-[var(--accent-sky)] font-bold text-sm">{score}% Mastery</span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-2.5 bg-[var(--bg-elev-1)] rounded-full accent-[var(--accent-mint)] cursor-pointer"
              />

              {/* Preset Quick-Picks */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SCORE_PRESETS.map((p) => {
                  const isSelected = score === p.val;
                  return (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setScore(p.val)}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent-mint)] text-black border-[var(--accent-mint)] font-bold shadow-sm'
                          : 'bg-[var(--bg-elev-1)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recalibrate CTA */}
            <button
              type="button"
              onClick={handleExecute}
              disabled={isApplying}
              className="h-12 px-6 rounded-xl font-mono font-bold text-sm text-black cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 shadow-lg bg-gradient-to-r from-[var(--accent-mint)] via-[var(--accent-sky)] to-[var(--accent-purple)] hover:opacity-95"
            >
              {isApplying ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Recalibrating Trajectory...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    Recalibrate & Adapt Roadmap to v{((roadmap?.version || 1.0) + 1.0).toFixed(1)}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Right Column: Circular Radar & Formula Terminal */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[130px_1fr] gap-4 items-center bg-[var(--bg-elev-2)] p-4 rounded-2xl border border-[var(--border)]">
              {/* Circular Gauge */}
              <div className="relative w-[110px] h-[110px] mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 110 110">
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke="var(--border)"
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
                      <stop offset="0%" stopColor="var(--accent-sky)" />
                      <stop offset="100%" stopColor="var(--accent-mint)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-xl font-bold text-[var(--text)] tabular-nums">{score}%</span>
                  <span className="text-[9px] text-[var(--text-muted)] uppercase">Score</span>
                </div>
              </div>

              {/* Projected Jump Metric */}
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                <span className="text-[var(--text-muted)] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[var(--accent-mint)]" /> Projected Level:
                </span>
                <div className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <span>{formatLevel(currentLevel)}</span>
                  <span className="text-[var(--accent-sky)]">→</span>
                  <span className="text-[var(--accent-mint)]">
                    <AnimatedNumber value={projectedLevel} decimals={1} /> / 5.0
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      levelDelta >= 0
                        ? 'bg-[var(--accent-mint)]/15 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {levelDelta >= 0 ? `+${formatLevel(levelDelta)} pts` : `${formatLevel(levelDelta)} pts`}
                  </span>
                  {estimatedHoursSaved > 0 && (
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--accent-sky)]" />
                      ~{estimatedHoursSaved}h saved
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cyber Formula Terminal */}
            <div className="bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-2xl p-3.5 font-mono text-xs leading-relaxed">
              <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-[var(--border)] text-[var(--text-muted)] text-[11px]">
                <Terminal className="w-3 h-3 text-[var(--accent-mint)]" />
                <span>DETERMINISTIC FORMULA ENGINE</span>
              </div>
              <div className="text-[var(--text-muted)] space-y-0.5 text-[11px]">
                <div>&gt; target = (score / 100) × 5.0 = {(targetScoreLevel).toFixed(2)}</div>
                <div>
                  &gt; new_level = round(current × 0.4 + target × 0.6, 1)
                </div>
                <div>
                  &gt;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= round({currentLevel.toFixed(1)} × 0.4 + {targetScoreLevel.toFixed(2)} × 0.6, 1) ={' '}
                  <span className="text-[var(--accent-mint)] font-bold">
                    {formatLevel(projectedLevel)}
                  </span>
                </div>
                <div className="text-[var(--text)] pt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[var(--accent-sky)]" />
                  <span>Next phase removes mastered topics & reallocates bandwidth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Audit Trail of Closed-Loop Evaluations */}
      <AssessmentHistory profileId={profile?.id || null} refreshTrigger={historyRefresh} />
    </div>
  );
};
