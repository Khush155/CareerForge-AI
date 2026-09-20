import React, { useState, useEffect } from 'react';
import { GapTrack } from '../../components/domain/GapTrack';
import { HeroOrbitalCore } from '../../components/3d/HeroOrbitalCore';
import { Card3DTilt } from '../../components/3d/Card3DTilt';
import { useAppStore } from '../../lib/store';
import type { StudentProfile } from '../../lib/schemas';
import {
  Sparkles,
  Cpu,
  Plus,
  Minus,
  X,
  ArrowRight,
  UserCheck,
  GraduationCap,
  Briefcase,
  Clock,
  Server,
  Code2,
  Cloud,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface ProfileFormProps {
  onSubmit: (profile: Partial<StudentProfile>) => Promise<void>;
  isGenerating: boolean;
  stageName?: string;
}

interface CareerRoleCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  degree: string;
  branch: string;
  year: number;
  weeklyHours: number;
  skills: { name: string; proficiency: number }[];
  description: string;
}

const CAREER_ROLES: CareerRoleCard[] = [
  {
    id: 'backend',
    title: 'Backend Engineer',
    icon: <Server className="w-4 h-4 text-[var(--neon-cyan)]" />,
    degree: 'B.Tech',
    branch: 'Computer Science',
    year: 3,
    weeklyHours: 20,
    skills: [
      { name: 'Python', proficiency: 2.5 },
      { name: 'SQL', proficiency: 1.5 },
      { name: 'Docker', proficiency: 1.0 },
      { name: 'System Design', proficiency: 0.5 },
    ],
    description: 'APIs, microservices, databases & high-throughput distributed architectures.',
  },
  {
    id: 'fullstack',
    title: 'Full Stack Engineer',
    icon: <Code2 className="w-4 h-4 text-[var(--neon-indigo)]" />,
    degree: 'B.Tech',
    branch: 'Information Technology',
    year: 4,
    weeklyHours: 25,
    skills: [
      { name: 'JavaScript', proficiency: 3.0 },
      { name: 'React', proficiency: 2.0 },
      { name: 'Python', proficiency: 2.0 },
      { name: 'SQL', proficiency: 1.5 },
    ],
    description: 'Modern frontend interfaces connected to reliable backend services & databases.',
  },
  {
    id: 'cloud_devops',
    title: 'DevOps & Cloud Engineer',
    icon: <Cloud className="w-4 h-4 text-[var(--neon-emerald)]" />,
    degree: 'B.Tech',
    branch: 'Computer Science',
    year: 3,
    weeklyHours: 20,
    skills: [
      { name: 'Linux', proficiency: 2.0 },
      { name: 'Docker', proficiency: 1.5 },
      { name: 'Kubernetes', proficiency: 0.5 },
      { name: 'CI/CD Pipelines', proficiency: 1.0 },
    ],
    description: 'Container orchestration, CI/CD automation pipelines & cloud infrastructure.',
  },
  {
    id: 'data_engineer',
    title: 'Data & Systems Engineer',
    icon: <Database className="w-4 h-4 text-[var(--neon-amber)]" />,
    degree: 'B.Tech',
    branch: 'Data Science',
    year: 3,
    weeklyHours: 20,
    skills: [
      { name: 'Python', proficiency: 2.5 },
      { name: 'SQL', proficiency: 2.0 },
      { name: 'PostgreSQL', proficiency: 1.5 },
      { name: 'Redis', proficiency: 1.0 },
    ],
    description: 'ETL pipelines, analytical schemas, in-memory caching & data storage engines.',
  },
];

const POPULAR_SKILLS = [
  'FastAPI', 'PostgreSQL', 'Redis', 'Kubernetes', 'Linux', 'AWS',
  'Git', 'CI/CD Pipelines', 'JavaScript', 'React', 'MongoDB',
];

export const ProfileForm: React.FC<ProfileFormProps> = ({
  onSubmit,
  isGenerating,
  stageName,
}) => {
  const { skills, setSkills, updateSkillProficiency, addSkill, removeSkill, marketRequirements } = useAppStore();

  const [name, setName] = useState('Aarav Sharma');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science');
  const [year, setYear] = useState(3);
  const [targetRole, setTargetRole] = useState('Backend Engineer');
  const [weeklyHours, setWeeklyHours] = useState(20);
  const [newSkillText, setNewSkillText] = useState('');
  const [selectedRoleCard, setSelectedRoleCard] = useState<string>('backend');

  // Hero miniature demo track animation
  const [miniValue, setMiniValue] = useState(1.5);
  useEffect(() => {
    const timer = setTimeout(() => setMiniValue(3.5), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectRole = (role: CareerRoleCard) => {
    setSelectedRoleCard(role.id);
    setTargetRole(role.title);
    setDegree(role.degree);
    setBranch(role.branch);
    setYear(role.year);
    setWeeklyHours(role.weeklyHours);
    setSkills(role.skills);
  };

  const handleAddSkill = () => {
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    addSkill(trimmed, 1.0);
    setNewSkillText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      degree,
      branch,
      year,
      target_role: targetRole,
      available_hours_per_week: weeklyHours,
      skills,
    });
  };

  return (
    <section id="profile-section" aria-labelledby="profile-heading" className="flex flex-col gap-8">
      {/* Entry Hero Grid: Headline & Orbital 3D Reactor */}
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 items-center max-lg:grid-cols-1">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-xs font-mono font-bold text-[var(--neon-cyan)] w-fit shadow-sm">
            <Cpu className="w-3.5 h-3.5" />
            <span>CAREERFORGE AI · PLACEMENT INTELLIGENCE</span>
          </div>

          <h1 id="profile-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
            <span className="brand-title">CareerForge </span>
            <span className="brand-accent">AI</span>:{' '}
            <span className="text-gradient-cyan">Precision Placement Preparation with Zero Hallucinations.</span>
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
            Calculates verified market benchmark gaps with mathematical certainty:{' '}
            <code className="text-xs font-mono text-[var(--neon-cyan)] bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
              gap = max(0, required − current)
            </code>
            . Tailored to your weekly study bandwidth and enriched with curated offline RAG guides.
          </p>

          {/* Miniature Hero Gap Track Demo */}
          <div className="glass-card rounded-2xl p-4 max-w-md flex flex-col gap-2.5">
            <div className="flex justify-between text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-semibold font-sans">
                <Sparkles className="w-3.5 h-3.5 text-[var(--neon-cyan)]" /> Live Math Calculation
              </span>
              <span className="tabular-nums text-[var(--neon-cyan)] font-bold">SQL: 1.5 → 3.5 req</span>
            </div>
            <GapTrack
              current={miniValue}
              required={3.5}
              size="sm"
              priority="High"
              animate={true}
              label="Hero mechanism demo"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-mono">
              <span>Proficiency: {miniValue.toFixed(1)} / 5.0</span>
              <span className="text-[var(--priority-high)] font-bold">Net Gap: 2.0 pts</span>
            </div>
          </div>
        </div>

        {/* 3D Hero Orbital Core Reactor */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)] text-xs font-mono">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--neon-emerald)] inline-block" />
              SYSTEM FEEDBACK ENGINE
            </span>
            <span className="text-[var(--neon-emerald)] font-semibold">7 STAGES ACTIVE</span>
          </div>
          <HeroOrbitalCore />
        </div>
      </div>

      {/* Interactive Career Role Cards Selector */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-baseline flex-wrap gap-2">
          <span className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Step 1: Choose Your Target Career Track (Click to Apply Persona)
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Auto-loads industry benchmarks & verified requirements
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {CAREER_ROLES.map((role) => {
            const isSelected = selectedRoleCard === role.id;
            return (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                  isSelected
                    ? 'bg-[var(--accent-quiet)] border-[var(--neon-cyan)] shadow-md'
                    : 'bg-[var(--glass-card)] border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-raised)]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 text-[var(--neon-cyan)]">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border-subtle)] flex items-center justify-center">
                    {role.icon}
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] font-sans">
                    {role.title}
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">
                  {role.description}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap pt-1 mt-auto text-[10px] font-mono text-[var(--text-muted)]">
                  <span className="px-1.5 py-0.2 rounded bg-[var(--bg-sunken)] border border-[var(--border-subtle)]">
                    {role.weeklyHours}h/wk
                  </span>
                  <span>·</span>
                  <span>{role.skills.length} core skills</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Profile & Skills Configuration Panel */}
      <Card3DTilt intensity={2} glare={true}>
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
              {/* Column 1: Academic Identity */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border-subtle)]">
                  <UserCheck className="w-4 h-4 text-[var(--neon-cyan)]" />
                  <span className="text-xs font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Student Details
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input-name" className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                    Student Full Name
                  </label>
                  <input
                    id="input-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="select-degree" className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                      Degree
                    </label>
                    <select
                      id="select-degree"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="h-10 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors cursor-pointer"
                    >
                      <option value="B.Tech">B.Tech</option>
                      <option value="B.E.">B.E.</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="B.S.">B.S.</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="select-year" className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                      Academic Year
                    </label>
                    <select
                      id="select-year"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="h-10 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors cursor-pointer"
                    >
                      <option value={1}>Year 1 (Freshman)</option>
                      <option value={2}>Year 2 (Sophomore)</option>
                      <option value={3}>Year 3 (Junior / Pre-final)</option>
                      <option value={4}>Year 4 (Senior / Final)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input-branch" className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                    Branch / Discipline
                  </label>
                  <input
                    id="input-branch"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="h-10 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Column 2: Placement Target & Bandwidth */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border-subtle)]">
                  <Briefcase className="w-4 h-4 text-[var(--neon-indigo)]" />
                  <span className="text-xs font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Target Role & Bandwidth
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input-role" className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                    Placement Goal
                  </label>
                  <input
                    id="input-role"
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="h-10 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-mono font-medium">
                    <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--neon-cyan)]" /> Available Weekly Study Bandwidth
                    </span>
                    <span className="tabular-nums text-[var(--neon-cyan)] font-bold">{weeklyHours} hrs/week</span>
                  </div>

                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={1}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full h-2.5 bg-[var(--bg-sunken)] rounded-full accent-[var(--neon-cyan)] cursor-pointer"
                  />

                  {/* Bandwidth Quick Preset Pills */}
                  <div className="flex items-center gap-2 pt-1">
                    {[10, 20, 30].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setWeeklyHours(hrs)}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                          weeklyHours === hrs
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                            : 'bg-[var(--bg-sunken)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]'
                        }`}
                      >
                        {hrs} hrs ({hrs === 10 ? 'Light' : hrs === 20 ? 'Optimal' : 'Intensive'})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Inventory & Interactive Proficiency Sliders */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-4">
              <div className="flex justify-between items-baseline flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[var(--neon-violet)]" />
                  <span className="text-xs font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Current Skill Ratings vs Industry Benchmark (0.0 to 5.0)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Use [-] and [+] steppers or drag sliders
                </span>
              </div>

              {/* Skills List with Steppers */}
              <div className="flex flex-col gap-3">
                {skills.map((skill, idx) => {
                  const reqItem = marketRequirements.find(
                    (m) => m.skill.toLowerCase() === skill.name.toLowerCase()
                  );
                  const reqVal = reqItem ? reqItem.required_level : 3.5;
                  const isBenchmarkMet = skill.proficiency >= reqVal;

                  return (
                    <div
                      key={skill.name}
                      className="grid grid-cols-[140px_1fr_120px_36px] items-center gap-3 max-md:grid-cols-[110px_1fr_100px_32px] p-3 rounded-xl bg-[var(--bg-sunken)]/50 border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                    >
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate font-sans">
                          {skill.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          Target: {reqVal.toFixed(1)}
                        </span>
                      </div>

                      <GapTrack
                        current={skill.proficiency}
                        required={reqVal}
                        size="md"
                        interactive={true}
                        onChange={(newVal) => updateSkillProficiency(idx, newVal)}
                        label={`${skill.name} slider`}
                      />

                      {/* Steppers & Value Display */}
                      <div className="flex items-center justify-end gap-1.5 font-mono">
                        <button
                          type="button"
                          onClick={() => updateSkillProficiency(idx, skill.proficiency - 0.2)}
                          className="w-6 h-6 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors"
                          aria-label={`Decrease ${skill.name}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-9 text-center font-bold text-xs tabular-nums text-[var(--text-primary)]">
                          {skill.proficiency.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSkillProficiency(idx, skill.proficiency + 0.2)}
                          className="w-6 h-6 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors"
                          aria-label={`Increase ${skill.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        {isBenchmarkMet && (
                          <span className="text-[10px] text-[var(--neon-emerald)] font-bold hidden sm:inline">
                            ✓
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSkill(idx)}
                        className="w-8 h-8 rounded-xl text-[var(--text-muted)] hover:text-[var(--priority-high)] hover:bg-[var(--priority-high)]/10 flex items-center justify-center cursor-pointer transition-colors"
                        aria-label={`Remove ${skill.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Popular Skill Catalog Suggestions */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Quick Add Verified Skill:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {POPULAR_SKILLS.filter(
                    (ps) => !skills.some((s) => s.name.toLowerCase() === ps.toLowerCase())
                  ).map((ps) => (
                    <button
                      key={ps}
                      type="button"
                      onClick={() => addSkill(ps, 1.0)}
                      className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--bg-sunken)] border border-[var(--border-subtle)] hover:border-[var(--neon-cyan)] text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{ps}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="flex gap-2 max-w-md mt-1">
                <input
                  type="text"
                  value={newSkillText}
                  onChange={(e) => setNewSkillText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Or type custom skill name..."
                  className="h-10 flex-1 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl px-3 text-sm text-[var(--text-primary)] focus:border-[var(--neon-cyan)] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="h-10 px-4 border border-[var(--border-default)] rounded-xl text-xs font-mono font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Form Submit Action */}
            <div className="flex justify-between items-center gap-4 pt-4 border-t border-[var(--border-subtle)] flex-wrap">
              <div className="flex items-center gap-2">
                {isGenerating && stageName ? (
                  <span className="text-xs font-mono text-[var(--neon-cyan)] flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[var(--neon-cyan)]" />
                    <span>SYNTHESIZING: {stageName.toUpperCase()}...</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {skills.length} skills ready for evaluation
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="h-11 px-8 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2.5 shadow-lg hover:shadow-xl bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-indigo)] to-[var(--neon-violet)] hover:opacity-95"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Forge Adaptive Roadmap</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Card3DTilt>
    </section>
  );
};
