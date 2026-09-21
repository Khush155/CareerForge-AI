import React, { useState, useMemo, useEffect } from 'react';
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
  Target,
  BookOpen,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Check,
} from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { AssessmentHistory } from '../../features/assess/AssessmentHistory';
import { formatLevel } from '../../lib/format';
import { SkillSelectDropdown, type SelectableSkillItem } from './SkillSelectDropdown';

interface AdaptationStudioProps {
  onApplyScore: (skill: string, score: number) => Promise<void>;
}

const SCORE_PRESETS = [
  { label: 'Novice', val: 25 },
  { label: 'Competent', val: 50 },
  { label: 'Proficient', val: 75 },
  { label: 'Advanced', val: 85 },
  { label: 'Mastery', val: 100 },
];

// Contextual mock diagnostic questions per skill category for the interactive test mode
const GENERATE_DIAGNOSTIC_QUESTIONS = (skillName: string) => [
  {
    id: 1,
    question: `Which fundamental principle is most critical when architecting or applying solutions in ${skillName}?`,
    options: [
      { text: 'Adhering to verified industry protocols, standards, and safety best practices', isCorrect: true },
      { text: 'Bypassing validation checks to maximize throughput without testing', isCorrect: false },
      { text: 'Using generic defaults without understanding edge case requirements', isCorrect: false },
    ],
  },
  {
    id: 2,
    question: `When diagnosing or troubleshooting a complex anomaly within ${skillName}, what is your primary methodology?`,
    options: [
      { text: 'Guessing and altering random parameters until the issue subsides', isCorrect: false },
      { text: 'Systematic root-cause isolation using telemetry, metrics, and differential diagnosis', isCorrect: true },
      { text: 'Restarting the process repeatedly without inspecting root logs', isCorrect: false },
    ],
  },
  {
    id: 3,
    question: `In a high-stakes, time-sensitive environment involving ${skillName}, how do you ensure high-quality execution?`,
    options: [
      { text: 'Relying strictly on memory without referring to checklists or documentation', isCorrect: false },
      { text: 'Executing validated procedural checklists with peer/supervisor verification', isCorrect: true },
      { text: 'Delegating without confirming execution or safety constraints', isCorrect: false },
    ],
  },
];

export const AdaptationStudio: React.FC<AdaptationStudioProps> = ({ onApplyScore }) => {
  const {
    profile,
    roadmap,
    skills,
    gaps,
    marketRequirements,
    lastAssessmentResult,
    lastAssessmentSummary,
  } = useAppStore();

  // Unified skills list: includes all skills discovered by AI, evaluated in gaps, covered in roadmap phases, and user-calibrated
  const availableSkills: SelectableSkillItem[] = useMemo(() => {
    const map = new Map<string, SelectableSkillItem>();

    // 1. Existing user-calibrated profile skills
    (profile?.skills || []).forEach((s) => {
      map.set(s.name.toLowerCase().trim(), {
        name: s.name,
        proficiency: s.proficiency,
        source: 'Calibrated Profile Skill',
        category: 'profile',
      });
    });

    // 2. AI Discovered Career Gaps (Evaluated Market Benchmark)
    (gaps || []).forEach((g) => {
      const key = g.skill.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.source = `Target Benchmark (${g.priority})`;
        existing.category = 'gap';
        existing.priority = g.priority;
        existing.gap = g.gap;
        existing.required_level = g.required_level;
      } else {
        map.set(key, {
          name: g.skill,
          proficiency: g.current_level,
          source: `AI Requirement (${g.priority})`,
          category: 'gap',
          priority: g.priority,
          gap: g.gap,
          required_level: g.required_level,
        });
      }
    });

    // 3. AI Market Requirements
    (marketRequirements || []).forEach((m) => {
      const key = m.skill.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          name: m.skill,
          proficiency: 0.0,
          source: `Market Need (${m.demand_level})`,
          category: 'market',
          required_level: m.required_level,
        });
      }
    });

    // 4. Skills covered in Roadmap Phases
    (roadmap?.phases || []).forEach((p) => {
      (p.skills_covered || []).forEach((s) => {
        const key = s.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            name: s,
            proficiency: 0.0,
            source: `Phase 0${p.phase_number} Topic`,
            category: 'phase',
          });
        }
      });
    });

    // 5. Fallback to store skills if empty
    if (map.size === 0) {
      skills.forEach((s) => {
        map.set(s.name.toLowerCase().trim(), {
          name: s.name,
          proficiency: s.proficiency,
          source: 'Initial Skill',
          category: 'profile',
        });
      });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [profile, gaps, marketRequirements, roadmap, skills]);

  const [selectedSkill, setSelectedSkill] = useState<string>(() => {
    return availableSkills[0]?.name || skills[0]?.name || 'Core Fundamentals';
  });

  // Keep selectedSkill synced if availableSkills updates
  useEffect(() => {
    if (availableSkills.length > 0 && !availableSkills.some((s) => s.name === selectedSkill)) {
      setSelectedSkill(availableSkills[0].name);
    }
  }, [availableSkills, selectedSkill]);

  const [score, setScore] = useState<number>(85);
  const [assessmentMode, setAssessmentMode] = useState<'slider' | 'quiz'>('slider');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [historyRefresh, setHistoryRefresh] = useState<number>(0);

  const activeSkillObj = availableSkills.find((s) => s.name === selectedSkill) || availableSkills[0];
  const currentLevel = activeSkillObj ? activeSkillObj.proficiency : 1.0;

  // Identify affected phase in the roadmap for curriculum context
  const affectedPhase = useMemo(() => {
    if (!roadmap) return null;
    const norm = selectedSkill.toLowerCase().trim();
    return roadmap.phases.find((p) =>
      p.skills_covered.some(
        (s) =>
          s.toLowerCase().trim() === norm ||
          (norm.length > 4 && s.toLowerCase().includes(norm)) ||
          (s.length > 4 && norm.includes(s.toLowerCase()))
      )
    );
  }, [roadmap, selectedSkill]);

  // Questions for current skill
  const currentQuestions = useMemo(() => {
    return GENERATE_DIAGNOSTIC_QUESTIONS(selectedSkill);
  }, [selectedSkill]);

  // Handle quiz option click & recalculate score
  const handleSelectQuizOption = (qId: number, optionIdx: number) => {
    const nextAnswers = { ...quizAnswers, [qId]: optionIdx };
    setQuizAnswers(nextAnswers);

    // Calculate score based on answered questions
    const answeredCount = Object.keys(nextAnswers).length;
    let correctCount = 0;
    currentQuestions.forEach((q) => {
      const selected = nextAnswers[q.id];
      if (selected !== undefined && q.options[selected]?.isCorrect) {
        correctCount += 1;
      }
    });

    if (answeredCount > 0) {
      const calculatedScore = Math.round((correctCount / currentQuestions.length) * 100);
      setScore(calculatedScore);
    }
  };

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
        className="glass-panel rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 border border-[var(--border)] max-w-2xl mx-auto"
      >
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 flex items-center justify-center text-[var(--accent-mint)]">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[var(--text)] font-display">
            Adaptive Recalibration Studio
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Once your initial career roadmap is forged, test competencies here to watch the closed-loop engine dynamically restructure your phases in real time.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Engine Telemetry Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev-1)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-mint)]/15 border border-[var(--accent-mint)]/30 flex items-center justify-center text-[var(--accent-mint)] shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Engine Version</span>
            <span className="text-xs font-bold text-[var(--text)] truncate">
              v{(roadmap?.version || 1.0).toFixed(1)} Active
            </span>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev-1)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-sky)]/15 border border-[var(--accent-sky)]/30 flex items-center justify-center text-[var(--accent-sky)] shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Target Role</span>
            <span className="text-xs font-bold text-[var(--text)] truncate">
              {profile?.target_role || 'Target Role'}
            </span>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev-1)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Feedback Law</span>
            <span className="text-xs font-bold text-[var(--text)] truncate">
              0.4 Profile / 0.6 Quiz
            </span>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev-1)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Total Roadmap</span>
            <span className="text-xs font-bold text-[var(--text)] truncate">
              {roadmap?.total_estimated_hours || 0} Hours Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Recalibration Workstation Card */}
      <section
        id="recalibration-section"
        aria-labelledby="studio-heading"
        className="glass-panel rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-xl flex flex-col gap-6 relative overflow-visible bg-[var(--bg-elev-1)]"
      >
        {/* Top Laser Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-sky)] via-[var(--accent-mint)] to-[var(--accent-purple)] rounded-t-3xl" />

        {/* Section Title & Calibration Mode Switcher */}
        <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <h3 id="studio-heading" className="text-lg font-bold text-[var(--text)] font-display flex items-center gap-2">
              <span>Recalibration Workstation</span>
              <span className="text-[11px] font-mono font-normal text-[var(--accent-mint)] bg-[var(--accent-mint)]/10 px-2 py-0.5 rounded-md border border-[var(--accent-mint)]/30">
                Closed-Loop Mode
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select any skill discovered across market research or phase milestones, then test to recalculate remaining hours.
            </p>
          </div>

          {/* Assessment Mode Toggle */}
          <div className="flex items-center bg-[var(--bg-elev-2)] p-1 rounded-xl border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setAssessmentMode('slider')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                assessmentMode === 'slider'
                  ? 'bg-[var(--accent-sky)] text-black font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Score Slider</span>
            </button>
            <button
              type="button"
              onClick={() => setAssessmentMode('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                assessmentMode === 'quiz'
                  ? 'bg-[var(--accent-mint)] text-black font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Diagnostic Quiz (3 Qs)</span>
            </button>
          </div>
        </div>

        {/* Two-Column Grid: Controls & Real-Time Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
          {/* Left Column: Skill Selection & Evaluation Controls */}
          <div className="flex flex-col gap-6">
            {/* 1. Skill Selector with Sleek Custom Combobox */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="studio-skill-select"
                  className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>1. Select Competency to Recalibrate:</span>
                  <span className="text-[var(--accent-sky)] font-normal">
                    ({availableSkills.length} Discovered by AI)
                  </span>
                </label>
                {affectedPhase && (
                  <span className="text-[11px] font-mono text-[var(--accent-sky)] flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Phase 0{affectedPhase.phase_number} Topic
                  </span>
                )}
              </div>

              <SkillSelectDropdown
                id="studio-skill-select"
                skills={availableSkills}
                selectedSkill={selectedSkill}
                onSelect={(skillName) => {
                  setSelectedSkill(skillName);
                  setQuizAnswers({});
                }}
              />
            </div>

            {/* 2. Assessment Mode: Slider Mode */}
            {assessmentMode === 'slider' && (
              <div className="flex flex-col gap-3 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-2xl p-3.5 shadow-sm">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    2. Quiz Assessment Performance:
                  </span>
                  <span className="text-[var(--accent-mint)] font-bold text-xs font-mono bg-[var(--accent-mint)]/10 px-2 py-0.5 rounded-md border border-[var(--accent-mint)]/30">
                    {score}% Mastery
                  </span>
                </div>

                <div className="relative py-0.5">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full h-2 bg-[var(--bg-elev-1)] rounded-full accent-[var(--accent-mint)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)] pt-0.5">
                    <span>0% (Untested)</span>
                    <span>50% (Competent)</span>
                    <span>100% (Mastery)</span>
                  </div>
                </div>

                {/* Preset Quick-Picks in a clean, compact 5-column segmented grid */}
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  {SCORE_PRESETS.map((p) => {
                    const isSelected = score === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setScore(p.val)}
                        className={`text-[11px] font-mono py-1 rounded-lg border transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[var(--accent-mint)] text-black border-[var(--accent-mint)] font-bold shadow-sm'
                            : 'bg-[var(--bg-elev-1)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <span className="font-bold leading-tight">{p.label}</span>
                        <span className="text-[9px] opacity-75">{p.val}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Assessment Mode: Diagnostic Quiz Mode */}
            {assessmentMode === 'quiz' && (
              <div className="flex flex-col gap-3 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-2xl p-3.5 shadow-sm">
                <div className="flex justify-between items-center text-xs font-mono pb-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
                    2. Rapid Diagnostic: {selectedSkill}
                  </span>
                  <span className="text-[var(--accent-mint)] font-bold text-xs bg-[var(--accent-mint)]/10 px-2 py-0.5 rounded-md border border-[var(--accent-mint)]/30">
                    Score: {score}%
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {currentQuestions.map((q) => {
                    const selectedOpt = quizAnswers[q.id];
                    return (
                      <div key={q.id} className="p-2.5 rounded-xl bg-[var(--bg-elev-1)] border border-[var(--border)] space-y-1.5">
                        <p className="text-xs font-sans font-semibold text-[var(--text)]">
                          {q.id}. {q.question}
                        </p>
                        <div className="space-y-1">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selectedOpt === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectQuizOption(q.id, optIdx)}
                                className={`w-full text-left p-1.5 rounded-lg text-xs font-sans transition-all border flex items-start gap-2 cursor-pointer ${
                                  isChosen
                                    ? opt.isCorrect
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                                      : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                    : 'bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                                }`}
                              >
                                <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center shrink-0 mt-0.5 text-[9px]">
                                  {isChosen ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1 text-[11px] leading-tight">{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recalibrate CTA Button - Sleek, Compact & Ergonomic */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleExecute}
                disabled={isApplying}
                className="w-full h-11 px-4 rounded-xl font-mono font-bold text-xs text-black cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md bg-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/90 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.99]"
              >
                {isApplying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Recalibrating Trajectory with AI Agent...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>
                      Recalibrate & Adapt Roadmap to v{((roadmap?.version || 1.0) + 1.0).toFixed(1)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Circular Radar & Dynamic Impact Matrix */}
          <div className="flex flex-col gap-5">
            {/* Impact Metric Gauge Box */}
            <div className="grid grid-cols-[130px_1fr] gap-4 items-center bg-[var(--bg-elev-2)] p-4.5 rounded-2xl border border-[var(--border)]">
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
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
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

            {/* Real-time Curriculum Rebalance Forecast Card */}
            <div className="bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-2.5 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-[var(--text)] font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-sky)]" />
                  Curriculum Impact Preview
                </span>
                <span className="text-[10px] text-[var(--accent-mint)] font-semibold">
                  Live Recalculation
                </span>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="flex items-start gap-2 text-[var(--text-muted)]">
                  <span className="text-[var(--accent-sky)] font-mono text-sm leading-none">•</span>
                  <span>
                    <strong className="text-[var(--text)]">Target Skill:</strong> {selectedSkill}
                  </span>
                </div>

                {affectedPhase ? (
                  <div className="flex items-start gap-2 text-[var(--text-muted)]">
                    <span className="text-[var(--accent-mint)] font-mono text-sm leading-none">•</span>
                    <span>
                      <strong className="text-[var(--text)]">Affects Phase {affectedPhase.phase_number}:</strong> {affectedPhase.title}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-[var(--text-muted)]">
                    <span className="text-[var(--accent-mint)] font-mono text-sm leading-none">•</span>
                    <span>
                      <strong className="text-[var(--text)]">Curriculum Scope:</strong> Cross-phase foundation competency
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-2 text-[var(--text-muted)]">
                  <span className="text-amber-400 font-mono text-sm leading-none">•</span>
                  <span>
                    <strong className="text-[var(--text)]">Bandwidth Reallocation:</strong>{' '}
                    {estimatedHoursSaved > 0
                      ? `Freed ${estimatedHoursSaved} hours from redundant study; rebalances active milestone deadlines.`
                      : 'Proficiency calibrated without timeline shift.'}
                  </span>
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
                <div>&gt; target = (score / 100) × 5.0 = {targetScoreLevel.toFixed(2)}</div>
                <div>
                  &gt; new_level = round({currentLevel.toFixed(1)} × 0.4 + {targetScoreLevel.toFixed(2)} × 0.6, 1) ={' '}
                  <span className="text-[var(--accent-mint)] font-bold">
                    {formatLevel(projectedLevel)}
                  </span>
                </div>
                <div className="text-[var(--text)] pt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[var(--accent-sky)]" />
                  <span>Roadmap version increments upon execution</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Recalibration Coaching Feedback from Live Azure AI */}
      {lastAssessmentSummary && lastAssessmentResult && (
        <div className="glass-panel rounded-3xl p-6 border border-[var(--accent-mint)]/40 bg-[var(--bg-elev-1)] shadow-xl relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-mint)] via-[var(--accent-sky)] to-[var(--accent-purple)]" />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent-mint)] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[var(--accent-sky)] animate-pulse" />
              <span>AI Closed-Loop Coaching Insight</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-elev-2)] px-2.5 py-1 rounded-full border border-[var(--border)]">
              Recalibrated: {lastAssessmentResult.skill} ({lastAssessmentResult.score_percentage}% Score · Level {formatLevel(lastAssessmentResult.previous_level)} → {formatLevel(lastAssessmentResult.updated_level)})
            </span>
          </div>
          <p className="text-sm font-sans text-[var(--text)] leading-relaxed bg-[var(--bg-elev-2)] p-4 rounded-2xl border border-[var(--border)]">
            "{lastAssessmentSummary}"
          </p>
        </div>
      )}

      {/* Embedded Audit Trail of Closed-Loop Evaluations */}
      <AssessmentHistory profileId={profile?.id || null} refreshTrigger={historyRefresh} />
    </div>
  );
};
