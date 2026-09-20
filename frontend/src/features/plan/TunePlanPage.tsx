import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Plus,
  Trash2,
  FileText,
  Shield,
  ChevronRight,
  Target,
  Sliders,
  Award,
} from 'lucide-react';
import { type RoleResolveResult } from '../../lib/api';
import type { StudentProfile, Skill } from '../../lib/schemas';
import { useAppStore } from '../../lib/store';
import { getCartoonAvatarUrl } from '../../lib/avatar';
import { toast } from 'sonner';

interface TunePlanPageProps {
  initialRoleQuery: string;
  resolvedData: RoleResolveResult;
  onBack: () => void;
  onSubmitPlan: (formData: Partial<StudentProfile>) => void;
  isGenerating: boolean;
}

const PROFICIENCY_LABELS = [
  { level: 0.0, title: 'Never', score: '0.0', label: 'Never (0.0)', short: '0.0' },
  { level: 1.0, title: 'Beg', score: '1.0', label: 'Beginner (1.0)', short: '1.0' },
  { level: 2.5, title: 'Mid', score: '2.5', label: 'Intermediate (2.5)', short: '2.5' },
  { level: 3.5, title: 'Adv', score: '3.5', label: 'Proficient (3.5)', short: '3.5' },
  { level: 4.5, title: 'Pro', score: '4.5', label: 'Expert (4.5)', short: '4.5' },
];

const COMPANY_TIERS = [
  'Product Tier 1 (FAANG / Big Tech)',
  'High-Growth Tech Scaleup',
  'FinTech & Quantitative Systems',
  'Enterprise & Cloud SaaS',
  'Early Stage Tech Startup',
];

export const TunePlanPage: React.FC<TunePlanPageProps> = ({
  initialRoleQuery,
  resolvedData,
  onBack,
  onSubmitPlan,
  isGenerating,
}) => {
  const { avatar, randomizeAvatar, profile } = useAppStore();
  const draftKey = `careerforge_draft_${resolvedData.role_id}`;

  // Ensure stale demo names like "Aarav Sharma" from previous sessions are wiped
  const [studentName, setStudentName] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('careerforge_draft_name');
      if (saved === 'Aarav Sharma') {
        localStorage.removeItem('careerforge_draft_name');
        return '';
      }
      if (saved) return saved;
    }
    return profile?.name && profile.name !== 'Aarav Sharma' ? profile.name : '';
  });

  const [degree, setDegree] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('careerforge_draft_degree');
      if (s) return s;
    }
    return profile?.degree && profile.degree !== 'B.Tech' ? profile.degree : '';
  });
  const [branch, setBranch] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('careerforge_draft_branch');
      if (s) return s;
    }
    return profile?.branch && profile.branch !== 'Computer Science' && profile.branch !== 'Computer Science & Engineering' ? profile.branch : '';
  });
  const [year, setYear] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('careerforge_draft_year');
      if (s) return Number(s);
    }
    return profile?.year || 1;
  });
  const [cgpa, setCgpa] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('careerforge_draft_cgpa') || '';
    }
    return '';
  });
  const [companyTarget, setCompanyTarget] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('careerforge_draft_company_target') || COMPANY_TIERS[0];
    }
    return COMPANY_TIERS[0];
  });
  const [weeklyHours, setWeeklyHours] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('careerforge_draft_weekly_hours');
      if (s) return Number(s);
    }
    return profile?.available_hours_per_week || 15;
  });
  const [targetDate, setTargetDate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('careerforge_draft_target_date') || '';
    }
    return '';
  });
  const [resumePaste, setResumePaste] = useState('');
  const [showResumeParser, setShowResumeParser] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');

  // Skill assessments: user requested skills NOT to be pre-selected on start (proficiency: null)
  const [userSkills, setUserSkills] = useState<{ name: string; proficiency: number | null; skipped: boolean }[]>(() => {
    const benchmarkSkills = resolvedData.benchmark.map((b) => ({
      name: b.name,
      proficiency: null as number | null,
      skipped: false,
    }));

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Check if draft contains old mock prefill (e.g. idx 0 is 2.5 and idx 1 is 1.5)
            const isOldMockDraft = parsed.some(
              (p) => p.proficiency === 2.5 || p.proficiency === 1.5
            );
            if (isOldMockDraft) {
              localStorage.removeItem(draftKey);
              return benchmarkSkills;
            }

            const validSaved = parsed.filter(
              (p) => typeof p.name === 'string' && p.name.trim().length > 1
            );
            if (validSaved.length > 0) {
              const merged = benchmarkSkills.map((bs) => {
                const match = validSaved.find(
                  (vs) => vs.name.toLowerCase() === bs.name.toLowerCase()
                );
                return match ? { ...bs, proficiency: match.proficiency, skipped: !!match.skipped } : bs;
              });

              validSaved.forEach((vs) => {
                if (!merged.some((m) => m.name.toLowerCase() === vs.name.toLowerCase())) {
                  merged.push({ name: vs.name, proficiency: vs.proficiency, skipped: !!vs.skipped });
                }
              });
              return merged;
            }
          }
        } catch {
          // ignore
        }
      }
    }
    return benchmarkSkills;
  });

  // Only auto-save draft if user actually entered custom data
  useEffect(() => {
    if (userSkills.some((s) => s.proficiency !== null)) {
      localStorage.setItem(draftKey, JSON.stringify(userSkills));
    }
    if (studentName.trim() && studentName !== 'Aarav Sharma') {
      localStorage.setItem('careerforge_draft_name', studentName);
    }
    if (degree) localStorage.setItem('careerforge_draft_degree', degree);
    if (branch) localStorage.setItem('careerforge_draft_branch', branch);
    localStorage.setItem('careerforge_draft_year', String(year));
    if (cgpa) localStorage.setItem('careerforge_draft_cgpa', cgpa);
    localStorage.setItem('careerforge_draft_company_target', companyTarget);
    localStorage.setItem('careerforge_draft_weekly_hours', String(weeklyHours));
    if (targetDate) localStorage.setItem('careerforge_draft_target_date', targetDate);
  }, [userSkills, studentName, draftKey, degree, branch, year, cgpa, companyTarget, weeklyHours, targetDate]);

  // Live telemetry calculations
  const { netGap, totalHours, estimatedWeeks, readinessScore, activeSkillsCount } = useMemo(() => {
    let gapSum = 0;
    let requiredSum = 0;
    let currentSum = 0;
    let calculatedHours = 0;
    let count = 0;

    userSkills.forEach((skill) => {
      if (skill.skipped) return;
      count += 1;
      const benchmark = resolvedData.benchmark.find(
        (b) => b.name.toLowerCase() === skill.name.toLowerCase()
      );
      const req = benchmark ? benchmark.required_level : 3.5;
      const prof = skill.proficiency !== null ? skill.proficiency : 0.0;
      const gap = Math.max(0, req - prof);

      gapSum += gap;
      requiredSum += req;
      currentSum += Math.min(prof, req);

      const est = benchmark ? (benchmark.est_hours || 25) : 25;
      calculatedHours += Math.round((gap / (req || 1)) * est);
    });

    const hours = Math.max(20, calculatedHours);
    const weeks = Math.max(2, Math.ceil(hours / (weeklyHours || 15)));
    const readiness = requiredSum > 0 ? Math.round((currentSum / requiredSum) * 100) : 50;

    return {
      netGap: Math.round(gapSum * 10) / 10,
      totalHours: hours,
      estimatedWeeks: weeks,
      readinessScore: Math.min(100, readiness),
      activeSkillsCount: count,
    };
  }, [userSkills, resolvedData.benchmark, weeklyHours]);

  const handleProficiencyChange = (skillName: string, level: number) => {
    setUserSkills((prev) =>
      prev.map((s) => (s.name === skillName ? { ...s, proficiency: level, skipped: false } : s))
    );
  };

  const handleToggleSkip = (skillName: string) => {
    setUserSkills((prev) =>
      prev.map((s) => (s.name === skillName ? { ...s, skipped: !s.skipped } : s))
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillName.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error('Please enter a valid skill name with at least 2 characters.');
      return;
    }
    if (userSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Skill '${trimmed}' is already in your plan.`);
      return;
    }
    setUserSkills((prev) => [...prev, { name: trimmed, proficiency: 1.0, skipped: false }]);
    setCustomSkillName('');
    toast.success(`Added custom skill: ${trimmed}`);
  };

  const handleRemoveSkill = (skillName: string) => {
    setUserSkills((prev) => prev.filter((s) => s.name !== skillName));
  };

  const handleParseResume = () => {
    if (!resumePaste.trim()) return;
    const lower = resumePaste.toLowerCase();
    let detected = 0;

    setUserSkills((prev) =>
      prev.map((s) => {
        if (lower.includes(s.name.toLowerCase())) {
          detected += 1;
          return { ...s, proficiency: Math.max(s.proficiency ?? 0.0, 2.5) };
        }
        return s;
      })
    );

    toast.success(`Detected ${detected} matching skills from your text! Levels updated.`);
    setShowResumeParser(false);
  };

  const handleSetAllProficiency = (level: number) => {
    setUserSkills((prev) =>
      prev.map((s) => ({ ...s, proficiency: level, skipped: false }))
    );
    toast.success(`Set all skills to ${level.toFixed(1)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Student Name
    if (!studentName.trim()) {
      toast.error('Please enter your full name before advancing.');
      return;
    }

    // 2. Validate Degree
    if (!degree.trim()) {
      toast.error('Please specify your Degree / Qualification (e.g. B.Tech / BCA / B.S.).');
      return;
    }

    // 3. Validate Branch
    if (!branch.trim()) {
      toast.error('Please specify your Branch / Specialization (e.g. Computer Science).');
      return;
    }

    // 4. Validate Skills Calibration (MUST be calibrated)
    const uncalibrated = userSkills.filter((s) => !s.skipped && s.proficiency === null);
    if (uncalibrated.length > 0) {
      toast.error(
        `Please calibrate all ${uncalibrated.length} remaining skill(s) before building your roadmap (select ratings 0.0 to 4.5, click 'All Beginner' / 'All Never', or skip).`
      );
      const skillsSection = document.getElementById('skills-calibration-section');
      if (skillsSection) {
        skillsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const activeSkills = userSkills.filter((s) => !s.skipped);
    if (activeSkills.length === 0) {
      toast.error('Please keep at least one active skill in your plan before building your roadmap.');
      return;
    }

    const compiledSkills: Skill[] = userSkills.map((s) => {
      const benchmark = resolvedData.benchmark.find(
        (b) => b.name.toLowerCase() === s.name.toLowerCase()
      );
      const reqLevel = benchmark ? benchmark.required_level : 4.0;
      return {
        name: s.name,
        proficiency: s.skipped ? reqLevel : (s.proficiency ?? 1.0),
      };
    });

    onSubmitPlan({
      name: studentName.trim(),
      degree: degree.trim(),
      branch: branch.trim(),
      year: Number(year),
      target_role: resolvedData.matched_role,
      available_hours_per_week: Number(weeklyHours),
      skills: compiledSkills,
      avatar,
    });
  };

  const handleResetForm = () => {
    setStudentName('');
    setDegree('');
    setBranch('');
    setYear(1);
    setCgpa('');
    setWeeklyHours(15);
    setTargetDate('');
    setUserSkills(
      resolvedData.benchmark.map((b) => ({
        name: b.name,
        proficiency: null,
        skipped: false,
      }))
    );
    if (typeof window !== 'undefined') {
      localStorage.removeItem(draftKey);
      localStorage.removeItem('careerforge_draft_name');
    }
    toast.info('Form cleared to fresh blank state.');
  };

  const uncalibratedCount = userSkills.filter((s) => !s.skipped && s.proficiency === null).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] flex-wrap gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dream Job Search</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs font-mono px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-elev-2)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-3)] transition-colors cursor-pointer"
            title="Reset form to a clean blank state"
          >
            ↺ Clear Form
          </button>
          <span
            className={`text-xs font-mono px-3 py-1 rounded-full font-semibold ${
              resolvedData.source_type === 'curated'
                ? 'bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/25'
                : 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border border-[var(--accent-amber)]/25'
            }`}
          >
            Source: {resolvedData.source_type === 'curated' ? 'Curated Standard' : 'Estimated Benchmark'}
          </span>
        </div>
      </div>

      {/* Target Role Hero Banner */}
      <div className="p-6 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[var(--accent-sky)] font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            <span>Target Career Objective</span>
            {initialRoleQuery && (
              <span className="text-[var(--text-muted)]">· Query: "{initialRoleQuery}"</span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)]">
            {resolvedData.matched_role}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-xl">
            {resolvedData.tagline}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-elev-2)] text-center font-mono border border-[var(--border)] min-w-[90px]">
            <div className="text-xl font-bold text-[var(--text)]">{resolvedData.benchmark.length}</div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Core Skills</div>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-elev-2)] text-center font-mono border border-[var(--border)] min-w-[90px]">
            <div className="text-xl font-bold text-[var(--accent-mint)]">{readinessScore}%</div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Est. Ready</div>
          </div>
        </div>
      </div>

      {/* Master Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ROW 1: EQUAL-HEIGHT CARDS (Student Profile on Left, Live Projection on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Card: Student Profile & Targets (7 Cols, equal height flex container) */}
          <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-6 h-full">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold font-display text-[var(--text)] pb-2 border-b border-[var(--border)]">
                <GraduationCap className="w-5 h-5 text-[var(--accent-indigo)]" />
                <span>Student Profile & Placement Targets</span>
              </div>

              {/* Clean, Non-Overlapping Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Full Name with Animated Cartoon Avatar */}
                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Full Name & Persona
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div className="relative group shrink-0" title="Custom Cartoon Profile Avatar (Click 🎲 to shuffle)">
                      <div className="w-11 h-11 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] overflow-hidden shadow-sm flex items-center justify-center p-0.5">
                        <img
                          src={getCartoonAvatarUrl(avatar, 'bottts')}
                          alt="Cartoon Avatar"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={randomizeAvatar}
                        title="Shuffle cartoon avatar"
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-indigo)] text-white flex items-center justify-center text-[9px] shadow-sm hover:scale-110 transition-transform cursor-pointer border border-[var(--border)]"
                      >
                        🎲
                      </button>
                    </div>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--accent-indigo)] outline-none font-body transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* 2. Target Company Tier */}
                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Target Company Tier
                  </label>
                  <select
                    value={companyTarget}
                    onChange={(e) => setCompanyTarget(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:border-[var(--accent-indigo)] outline-none cursor-pointer"
                  >
                    {COMPANY_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Degree */}
                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Degree / Qualification
                  </label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. B.Tech / B.S."
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--accent-indigo)] outline-none font-body transition-colors"
                  />
                </div>

                {/* 4. Branch / Major */}
                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Branch / Specialization
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--accent-indigo)] outline-none font-body transition-colors"
                  />
                </div>

                {/* 5. Academic Year */}
                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Current Academic Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:border-[var(--accent-indigo)] outline-none cursor-pointer"
                  >
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Junior / Placement Year)</option>
                    <option value={4}>4th Year (Senior / Final Year)</option>
                  </select>
                </div>

                {/* 6. Current CGPA */}
                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Current CGPA / Score
                  </label>
                  <input
                    type="text"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="e.g. 8.4 / 10.0"
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--accent-indigo)] outline-none font-body transition-colors"
                  />
                </div>

                {/* 7. Target Placement Deadline (Spans full width of inner grid) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Target Placement Deadline
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:border-[var(--accent-indigo)] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Weekly Study Hours Slider */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[var(--accent-indigo)]" />
                  Weekly Commitment
                </span>
                <span className="font-mono font-bold text-[var(--accent-indigo)] text-sm">
                  {weeklyHours} hrs/week (≈ {estimatedWeeks} wks to ready)
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={1}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-[var(--accent-indigo)] cursor-pointer h-2 bg-[var(--bg-elev-2)] rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>5 hrs (Steady)</span>
                <span>20 hrs (Optimal)</span>
                <span>40 hrs (Intensive Boot Camp)</span>
              </div>
            </div>
          </div>

          {/* Right Card: Live Roadmap Projection (5 Cols, equal height flex container) */}
          <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-xl flex flex-col justify-between space-y-6 h-full relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-mint)] via-[var(--accent-sky)] to-[var(--accent-purple)]" />

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-mono text-[var(--accent-mint)] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Live Roadmap Projection
                  </div>
                  <h3 className="text-xl font-bold font-display text-[var(--text)]">
                    {resolvedData.matched_role}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30 text-xs font-mono font-bold">
                  v1.0 Synthesis
                </span>
              </div>

              {/* 4 Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">Readiness Score</div>
                  <div className="text-2xl font-bold font-display text-[var(--accent-mint)]">
                    {readinessScore}%
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                    {activeSkillsCount} Active Skills
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">Net Skill Gap</div>
                  <div className="text-2xl font-bold font-display text-[var(--color-critical)]">
                    {netGap} <span className="text-xs font-normal text-[var(--text-muted)]">pts</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                    Deterministic delta
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">Estimated Effort</div>
                  <div className="text-2xl font-bold font-display text-[var(--text)]">
                    {totalHours} <span className="text-xs font-normal text-[var(--text-muted)]">hrs</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                    Curriculum budget
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">Pacing Timeline</div>
                  <div className="text-2xl font-bold font-display text-[var(--accent-indigo)]">
                    ≈ {estimatedWeeks} <span className="text-xs font-normal text-[var(--text-muted)]">wks</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                    At {weeklyHours}h per week
                  </div>
                </div>
              </div>

              {/* Verification Callout */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[var(--accent-mint)]">
                  <Shield className="w-4 h-4 text-[var(--accent-mint)]" />
                  <span>Deterministic Placement Assurance</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Calculated against verified employer competencies. Zero invented milestones.
                </p>
              </div>
            </div>

            {/* Main Primary Submit CTA */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--accent-indigo)] via-[var(--accent-violet)] to-[var(--accent-pink)] text-white text-sm font-bold shadow-lg hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
              <span>
                {isGenerating
                  ? 'Synthesizing Roadmap...'
                  : uncalibratedCount > 0
                  ? `Calibrate Skills (${uncalibratedCount} Left) to Build Roadmap`
                  : 'Build My Adaptive Roadmap'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ROW 2: FULL-WIDTH SKILLS PROFICIENCY CALIBRATION (COMPACT & SLEEK) */}
        <div
          id="skills-calibration-section"
          className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm space-y-4 w-full scroll-mt-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-[var(--text)]">
                  Skill Proficiency Calibration
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-elev-2)] text-[var(--text-muted)] border border-[var(--border)] font-semibold">
                  {userSkills.length} Skills
                </span>
                {uncalibratedCount > 0 ? (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--accent-amber)]/15 text-[var(--accent-amber)] border border-[var(--accent-amber)]/30 font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)]" />
                    {uncalibratedCount} Uncalibrated
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--accent-mint)]/15 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30 font-semibold">
                    All Calibrated ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Adjust baseline comfort levels or skip skills you have already mastered.
              </p>
            </div>

            {/* Quick Batch Actions & Resume Parser Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSetAllProficiency(1.0)}
                className="text-xs font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elev-2)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-3)] transition-colors cursor-pointer"
                title="Quickly set all skills to Beginner (1.0)"
              >
                All Beginner
              </button>
              <button
                type="button"
                onClick={() => handleSetAllProficiency(0.0)}
                className="text-xs font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elev-2)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-3)] transition-colors cursor-pointer"
                title="Quickly set all skills to Never (0.0)"
              >
                All Never
              </button>
              <button
                type="button"
                onClick={() => setShowResumeParser(!showResumeParser)}
                className="text-xs font-mono font-semibold text-[var(--accent-indigo)] inline-flex items-center gap-1.5 cursor-pointer bg-[var(--bg-elev-2)] px-2.5 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-elev-3)] transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showResumeParser ? 'Hide Parser' : 'Paste Resume'}</span>
              </button>
            </div>
          </div>

          {/* Optional Resume / Skills Text Paste Box */}
          {showResumeParser && (
            <div className="p-3.5 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] space-y-2 animate-in fade-in">
              <label className="block text-xs font-medium text-[var(--text)]">
                Paste your resume snippet, project bullet points, or skills list:
              </label>
              <textarea
                rows={2}
                value={resumePaste}
                onChange={(e) => setResumePaste(e.target.value)}
                placeholder="e.g. Worked with Python, Docker containers, PostgreSQL databases, FastAPI and Git workflows..."
                className="w-full p-2.5 rounded-xl bg-[var(--bg-elev-1)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none font-body"
              />
              <button
                type="button"
                onClick={handleParseResume}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-indigo)] text-white text-xs font-semibold hover:opacity-90 transition-all cursor-pointer font-mono"
              >
                Auto-Detect & Upgrade Proficiencies
              </button>
            </div>
          )}

          {/* Compact, Sleek Skills Calibration Rows */}
          <div className="space-y-2">
            {userSkills.map((skill) => {
              const benchmark = resolvedData.benchmark.find(
                (b) => b.name.toLowerCase() === skill.name.toLowerCase()
              );
              const reqLevel = benchmark ? benchmark.required_level : 3.5;
              const bAny = benchmark as Record<string, any> | undefined;
              const hoursToLearn = bAny?.est_hours || bAny?.est_hours_to_learn || 25;
              const category = bAny?.category || 'core';
              const isCustom = !resolvedData.benchmark.some(
                (b) => b.name.toLowerCase() === skill.name.toLowerCase()
              );

              return (
                <div
                  key={skill.name}
                  className={`px-4 py-2.5 rounded-2xl border transition-all ${
                    skill.skipped
                      ? 'bg-[var(--bg-elev-2)]/30 border-[var(--border)] opacity-60'
                      : 'bg-[var(--bg-elev-2)] border-[var(--border)] hover:border-[var(--border-strong)]'
                  } flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[64px]` }
                >
                  {/* Left: Consistent 2-Line Hierarchy (Title + Metadata Strip) */}
                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-sm font-bold font-sans text-[var(--text)] truncate max-w-[240px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[380px] xl:max-w-[460px]"
                        title={skill.name}
                      >
                        {skill.name}
                      </span>
                      {isCustom && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/20 shrink-0 font-semibold">
                          Custom
                        </span>
                      )}
                      {skill.proficiency === null && !skill.skipped && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-amber)]/15 text-[var(--accent-amber)] border border-[var(--accent-amber)]/30 animate-pulse shrink-0">
                          Needs Rating
                        </span>
                      )}
                    </div>

                    {/* Uniform Metadata Strip across all rows */}
                    <div className="flex items-center gap-2 text-xs overflow-hidden">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-elev-1)] text-[var(--accent-sky)] border border-[var(--border)] font-semibold shrink-0">
                        Req: {reqLevel.toFixed(1)} / 5.0
                      </span>
                      {category && (
                        <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] bg-[var(--bg-elev-1)] px-1.5 py-0.5 rounded border border-[var(--border)] shrink-0">
                          {category}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
                        ≈{hoursToLearn}h
                      </span>
                    </div>
                  </div>

                  {/* Right: Clean Segmented Rating Bar & Controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <div className="inline-flex items-center rounded-xl bg-[var(--bg-elev-1)] p-0.5 border border-[var(--border)] shadow-xs">
                      {PROFICIENCY_LABELS.map((p) => {
                        const isSelected =
                          !skill.skipped &&
                          skill.proficiency !== null &&
                          Math.abs(skill.proficiency - p.level) < 0.6;
                        return (
                          <button
                            key={p.level}
                            type="button"
                            onClick={() => handleProficiencyChange(skill.name, p.level)}
                            title={`${p.title} (${p.score} / 5.0)`}
                            className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap text-center ${
                              isSelected
                                ? 'bg-[var(--accent-indigo)] text-white font-bold shadow-xs'
                                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)]'
                            }`}
                          >
                            <span className="font-semibold">{p.short}</span>
                            <span className="hidden md:inline ml-1 opacity-80">{p.title}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Skip Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleSkip(skill.name)}
                      className={`text-xs font-mono px-3 py-1 rounded-lg border transition-all cursor-pointer shrink-0 min-w-[76px] text-center ${
                        skill.skipped
                          ? 'bg-[var(--accent-mint)]/15 border-[var(--accent-mint)]/40 text-[var(--accent-mint)] font-bold'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--bg-elev-1)] hover:bg-[var(--bg-elev-2)]'
                      }`}
                      title="Skip this skill if you already mastered it"
                    >
                      {skill.skipped ? 'Mastered ✓' : 'Skip'}
                    </button>

                    {/* Delete Custom Skill */}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.name)}
                        className="p-1.5 rounded-lg text-[var(--color-critical)] hover:bg-[var(--color-critical)]/10 cursor-pointer shrink-0"
                        title="Remove custom skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Custom Skill Row */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="text"
              value={customSkillName}
              onChange={(e) => setCustomSkillName(e.target.value)}
              placeholder="Add custom skill or framework (e.g. Next.js, Redis, AWS, Tailwind, GraphQL...)"
              className="flex-1 h-11 px-4 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--accent-indigo)] outline-none font-body"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="h-11 px-5 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[var(--accent-indigo)]" />
              <span>Add Custom Skill</span>
            </button>
          </div>

          {/* Bottom Summary & Secondary CTA */}
          <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-[var(--text-muted)] text-center sm:text-left">
              Review your proficiencies above. The engine will calculate your exact skill gap matrix.
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-[var(--accent-indigo)] via-[var(--accent-violet)] to-[var(--accent-pink)] text-white text-sm font-bold shadow-lg hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
              <span>
                {isGenerating
                  ? 'Synthesizing Roadmap...'
                  : uncalibratedCount > 0
                  ? `Calibrate Skills (${uncalibratedCount} Left) to Build Roadmap`
                  : 'Build My Adaptive Roadmap'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
