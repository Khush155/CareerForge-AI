import React, { useState, useMemo } from 'react';

import { AppShell, PageHeader } from '../components/layout/AppShell';
import { SearchHome } from '../features/home/SearchHome';
import { TunePlanPage } from '../features/plan/TunePlanPage';
import { AgentWorkingSequence } from '../features/plan/AgentWorkingSequence';
import { DashboardOverview } from '../features/dashboard/DashboardOverview';
import { GapMatrix } from '../components/domain/GapMatrix';
import { BudgetStrip, type BudgetSegment } from '../components/domain/BudgetStrip';
import { RoadmapTimeline } from '../components/domain/RoadmapTimeline';
import { DiffStrip } from '../components/domain/DiffStrip';
import { AssessmentDialog } from '../components/domain/AssessmentDialog';
import { EvidenceDrawer } from '../components/domain/EvidenceDrawer';
import { AdaptationStudio } from '../components/domain/AdaptationStudio';
import { ConfettiBurst } from '../components/3d/ConfettiBurst';
import { ProgressAnalytics } from '../features/progress/ProgressAnalytics';
import { KeyboardShortcutsModal } from '../components/domain/KeyboardShortcutsModal';
import { ExportShareModal } from '../components/domain/ExportShareModal';

import { useAppStore } from '../lib/store';
import { getCartoonAvatarUrl } from '../lib/avatar';
import { submitProfile, submitAssessment, resolveRoleQuery, type RoleResolveResult } from '../lib/api';
import type { StudentProfile, Skill } from '../lib/schemas';
import {
  ShieldCheck,
  BookOpen,
  Sparkles,
  GraduationCap,
  Users,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export const App: React.FC = () => {
  const {
    profile,
    roadmap,
    previousRoadmap,
    gaps,
    skills,
    marketRequirements,
    currentSection,
    setCurrentSection,
    isAssessmentOpen,
    openAssessment,
    closeAssessment,
    isEvidenceOpen,
    activeEvidenceSkill,
    openEvidence,
    closeEvidence,
    lastAssessmentResult,
    lastAssessmentSummary,
    isShortcutsOpen,
    setShortcutsOpen,
    isExportOpen,
    setExportOpen,
    setInitialPlan,
    applyAdaptedPlan,
    avatar,
    setAvatar,
    randomizeAvatar,
    savedProfiles,
    switchProfile,
    deleteSavedProfile,
  } = useAppStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [highlightedSkill, setHighlightedSkill] = useState<string | null>(null);
  const [changedPhases, setChangedPhases] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Clean up any legacy localStorage drafts that locked previous sessions into TunePlanPage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('careerforge_pending_role_query');
      localStorage.removeItem('careerforge_pending_resolved_role');
    }
  }, []);

  const [selectedRoleQuery, setSelectedRoleQuery] = useState<string | null>(null);
  const [resolvedRoleData, setResolvedRoleData] = useState<RoleResolveResult | null>(null);
  const [isResolvingRole, setIsResolvingRole] = useState(false);
  const [targetAssessmentSkill, setTargetAssessmentSkill] = useState<string | null>(null);

  const handleNavigateHome = () => {
    setResolvedRoleData(null);
    setSelectedRoleQuery(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('careerforge_pending_role_query');
      localStorage.removeItem('careerforge_pending_resolved_role');
      sessionStorage.removeItem('careerforge_pending_role_query');
      sessionStorage.removeItem('careerforge_pending_resolved_role');
    }
    setCurrentSection('home');
  };

  // Compute all discovered career skills (combines calibrated profile skills, AI discovered gaps, market reqs, and roadmap phases)
  const allCareerSkills = useMemo(() => {
    const map = new Map<string, Skill>();

    (profile?.skills || []).forEach((s) => {
      map.set(s.name.toLowerCase().trim(), s);
    });

    (gaps || []).forEach((g) => {
      const key = g.skill.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          name: g.skill,
          proficiency: g.current_level,
        });
      }
    });

    (marketRequirements || []).forEach((m) => {
      const key = m.skill.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          name: m.skill,
          proficiency: 0.0,
        });
      }
    });

    (roadmap?.phases || []).forEach((p) => {
      (p.skills_covered || []).forEach((s) => {
        const key = s.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            name: s,
            proficiency: 0.0,
          });
        }
      });
    });

    if (map.size === 0) {
      skills.forEach((s) => map.set(s.name.toLowerCase().trim(), s));
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [profile, gaps, marketRequirements, roadmap, skills]);

  const handleOpenAssessment = (skill?: string) => {
    if (skill) {
      setTargetAssessmentSkill(skill);
    }
    openAssessment();
  };

  const handleSelectRole = async (roleQuery: string) => {
    try {
      setIsResolvingRole(true);
      const result = await resolveRoleQuery(roleQuery);
      if (result.source_type === 'unrecognized' || !result.matched_role || result.confidence === 0) {
        toast.error(
          result.message ||
            `No recognized career track found for "${roleQuery}". Please check the spelling or search for a recognized role like "Software Engineer", "Data Analyst", or "Product Manager".`,
          { duration: 5000 }
        );
        setSelectedRoleQuery(null);
        setResolvedRoleData(null);
        return;
      }
      setSelectedRoleQuery(roleQuery);
      setResolvedRoleData(result);
    } catch (err: any) {
      toast.error(`Could not resolve role: ${err.message}`);
    } finally {
      setIsResolvingRole(false);
    }
  };

  // Handle Initial Profile Submission
  const handleProfileSubmit = async (formData: Partial<StudentProfile>) => {
    const studentName = formData.name?.trim();
    if (!studentName) {
      toast.error('Please enter your full name before advancing.');
      return;
    }
    const role = formData.target_role?.trim();
    if (!role) {
      toast.error('Please specify your target career role.');
      return;
    }
    const degree = formData.degree?.trim();
    if (!degree) {
      toast.error('Please specify your Degree / Qualification.');
      return;
    }
    const branch = formData.branch?.trim();
    if (!branch) {
      toast.error('Please specify your Branch / Specialization.');
      return;
    }
    const candidateSkills = (formData.skills && formData.skills.length > 0) ? formData.skills : skills;
    if (!candidateSkills || candidateSkills.length === 0) {
      toast.error('Please add and calibrate at least one skill before building your roadmap.');
      return;
    }

    try {
      setIsGenerating(true);

      if ((formData as any).avatar) {
        setAvatar((formData as any).avatar);
      }

      const response = await submitProfile({
        name: studentName,
        degree,
        branch,
        year: formData.year || 1,
        target_role: role,
        available_hours_per_week: formData.available_hours_per_week || 20,
        skills: candidateSkills,
      });

      setInitialPlan({
        profile: response.profile,
        marketRequirements: response.market_requirements,
        gaps: response.gaps,
        roadmap: response.roadmap,
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('careerforge_pending_role_query');
        localStorage.removeItem('careerforge_pending_resolved_role');
      }

      setShowConfetti(true);
      toast.success(`Roadmap generated for ${response.profile.target_role}!`);
      setCurrentSection('dashboard');
    } catch (err: any) {
      toast.error(`Generation failed: ${err.message || 'Check server connection'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Assessment Score Submission
  const handleApplyScore = async (skill: string, score: number) => {
    if (!profile) {
      toast.error('Load or generate a profile before submitting assessment.');
      return;
    }

    try {
      const response = await submitAssessment({
        profile_id: profile.id || 'current',
        skill,
        score_percentage: score,
      });

      const oldPhases = roadmap?.phases.map((p) => p.phase_number) || [];
      const newPhases = response.roadmap.phases.map((p) => p.phase_number);
      const removed = oldPhases.filter((p) => !newPhases.includes(p));
      setChangedPhases(removed);

      applyAdaptedPlan({
        result: response.result,
        updatedProfile: response.updated_profile,
        gaps: response.gaps,
        roadmap: response.roadmap,
        summary: response.summary,
      });

      setShowConfetti(true);
      closeAssessment();
      toast.success(response.summary);
    } catch (err: any) {
      toast.error(`Assessment failed: ${err.message || 'Check connection'}`);
    }
  };

  // Bandwidth Budget Allocation calculation
  const budgetSegments: BudgetSegment[] = [];
  if (roadmap && roadmap.phases.length > 0) {
    const skillHoursMap: Record<string, number> = {};
    roadmap.phases.forEach((phase) => {
      const perSkill = Math.round(phase.estimated_hours / (phase.skills_covered.length || 1));
      phase.skills_covered.forEach((s) => {
        skillHoursMap[s] = (skillHoursMap[s] || 0) + perSkill;
      });
    });

    Object.entries(skillHoursMap).forEach(([skillName, hours]) => {
      const g = gaps.find((gap) => gap.skill.toLowerCase() === skillName.toLowerCase());
      budgetSegments.push({
        skill: skillName,
        hours,
        priority: g ? g.priority : 'Low',
      });
    });
  }

  const activeEvidenceGap = gaps.find(
    (g) => g.skill.toLowerCase() === (activeEvidenceSkill || '').toLowerCase()
  );

  return (
    <AppShell onNavigateHome={handleNavigateHome}>
      {/* Celebratory Adaptation Confetti Burst */}
      <ConfettiBurst trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Pinned Adaptation Diff Strip */}
      {lastAssessmentResult && lastAssessmentSummary && (
        <div className="mb-6">
          <DiffStrip
            fromVersion={previousRoadmap ? previousRoadmap.version : 1}
            toVersion={roadmap ? roadmap.version : 2}
            result={lastAssessmentResult}
            summary={lastAssessmentSummary}
            onDismiss={() => useAppStore.setState({ lastAssessmentResult: null })}
          />
        </div>
      )}

      {/* Full-screen Agent Working Sequence during plan synthesis */}
      {isGenerating && (
        <AgentWorkingSequence
          targetRole={resolvedRoleData?.matched_role || profile?.target_role || 'Target Role'}
        />
      )}

      {/* SECTION: Home (Dream Job Engine Entrypoint) */}
      {currentSection === 'home' && (
        <>
          {resolvedRoleData ? (
            <TunePlanPage
              initialRoleQuery={selectedRoleQuery || ''}
              resolvedData={resolvedRoleData}
              onBack={handleNavigateHome}
              onSubmitPlan={handleProfileSubmit}
              isGenerating={isGenerating}
              onSelectAlternativeRole={handleSelectRole}
            />
          ) : (
            <SearchHome onSelectRole={handleSelectRole} isResolving={isResolvingRole} />
          )}
        </>
      )}

      {/* SECTION: Dashboard */}
      {currentSection === 'dashboard' && (
        <DashboardOverview
          onOpenAssessment={handleOpenAssessment}
          onOpenEvidence={(skill) => openEvidence(skill)}
        />
      )}

      {/* SECTION: Skill Gaps */}
      {currentSection === 'gaps' && (
        <div className="space-y-6">
          <PageHeader
            title="Skill Gap Matrix"
            subtitle="Deterministic gap calculation: Gap = max(0, Required − Current). Multi-view comparison across Table, Heatmap, and Radar dimensions."
            actions={
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 font-mono text-xs font-bold text-[var(--accent-mint)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Deterministic Math
              </span>
            }
          />
          {gaps.length > 0 ? (
            <GapMatrix
              gaps={gaps}
              onSelectSkill={(skill) => openEvidence(skill)}
              onOpenAssessment={handleOpenAssessment}
            />
          ) : (
            <div className="p-12 text-center text-sm text-[var(--text-muted)] bg-[var(--bg-elev-1)] rounded-2xl border border-[var(--border)]">
              No active gaps found. Configure a profile on the Home screen or load the demo student.
            </div>
          )}
        </div>
      )}

      {/* SECTION: Roadmap */}
      {currentSection === 'roadmap' && (
        <div className="space-y-6">
          <PageHeader
            title="Adaptive Phased Roadmap"
            subtitle={
              roadmap
                ? `${roadmap.total_estimated_hours} total hours across ${roadmap.phases.length} sequential execution stages.`
                : 'Phased execution timeline.'
            }
            actions={
              roadmap && (
                <span className="font-mono text-xs font-bold text-[var(--accent-sky)] bg-[var(--accent-sky)]/10 px-3 py-1 rounded-full border border-[var(--accent-sky)]/30">
                  Dynamic Revision v{(Number(roadmap?.version) || 1).toFixed(1)}
                </span>
              )
            }
          />

          {roadmap && (
            <BudgetStrip
              segments={budgetSegments}
              totalHours={roadmap?.total_estimated_hours || 0}
              weeklyHours={roadmap?.available_hours_per_week || 20}
              onHoverSegment={setHighlightedSkill}
            />
          )}

          {roadmap ? (
            <RoadmapTimeline
              phases={roadmap.phases}
              gaps={gaps}
              weeklyHours={roadmap.available_hours_per_week}
              highlightedSkill={highlightedSkill}
              onOpenResource={(title) => openEvidence(title)}
              changedPhases={changedPhases}
            />
          ) : (
            <div className="p-12 text-center text-sm text-[var(--text-muted)] bg-[var(--bg-elev-1)] rounded-2xl border border-[var(--border)]">
              No roadmap loaded yet. Build one from the Home screen or click Try Demo Student in the top bar.
            </div>
          )}
        </div>
      )}

      {/* SECTION: Assess */}
      {currentSection === 'assess' && (
        <div className="space-y-6">
          <PageHeader
            title="Live Skill Recalibration Studio"
            subtitle="Closed-loop assessment engine. Test competencies or simulate quiz scores to watch the AI agent dynamically rebalance phases, free up bandwidth, and shift remaining hours in real time."
          />
          <AdaptationStudio onApplyScore={handleApplyScore} />
        </div>
      )}

      {/* SECTION: Progress */}
      {currentSection === 'progress' && (
        <div className="space-y-6">
          <PageHeader
            title="Progress & Readiness Analytics"
            subtitle="Deterministic readiness percentage, velocity runway, and interactive milestone execution."
          />
          <ProgressAnalytics />
        </div>
      )}

      {/* SECTION: Resources */}
      {currentSection === 'resources' && (
        <div className="space-y-6">
          <PageHeader
            title="Curated Study Guides & Documentation"
            subtitle="High-yield placement preparation guides cited with verified industry benchmarks."
          />
          {gaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gaps.map((gap) => (
                <div
                  key={gap.skill}
                  className="p-5 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[var(--accent-indigo)] font-semibold uppercase">
                        {gap.priority} Priority
                      </span>
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        Gap: {gap.gap.toFixed(1)} pts
                      </span>
                    </div>
                    <h4 className="text-base font-bold font-display text-[var(--text)] mb-1">
                      {gap.skill} Preparation Guide
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                      Industry benchmark: Level {gap.required_level.toFixed(1)} ({gap.demand_level} demand).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEvidence(gap.skill)}
                    className="mt-4 w-full py-2 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] text-xs font-semibold text-[var(--text)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[var(--accent-sky)]" />
                    <span>Read Study Guide</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-[var(--text-muted)] bg-[var(--bg-elev-1)] rounded-2xl border border-[var(--border)]">
              No study guides available yet. Generate a roadmap on the Home screen or load the demo student to explore curated preparation guides.
            </div>
          )}
        </div>
      )}

      {/* SECTION: Settings / Profile Management */}
      {currentSection === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          <PageHeader
            title="Profile & Target Settings"
            subtitle="Manage your personal profile, career milestones, and system configuration."
          />

          {/* Card 1: Active Student Profile & Creation Hub */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3.5">
                <div className="relative group shrink-0" title="Custom Cartoon Profile Avatar (Click 🎲 to shuffle)">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] overflow-hidden shadow-sm flex items-center justify-center p-0.5">
                    <img
                      src={getCartoonAvatarUrl(profile?.avatar || avatar)}
                      alt="Cartoon Avatar"
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={randomizeAvatar}
                    title="Shuffle cartoon avatar"
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-indigo)] text-white flex items-center justify-center text-[10px] shadow-sm hover:scale-110 transition-transform cursor-pointer border border-[var(--border)]"
                  >
                    🎲
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold font-display text-[var(--text)]">
                      {profile ? profile.name : 'Guest Student'}
                    </h3>
                    {profile && (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold border bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border-[var(--accent-mint)]/30">
                        Active Profile
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {profile
                      ? `${profile.target_role} · ${profile.degree} ${profile.branch} (Year ${profile.year}) · ${profile.available_hours_per_week || 15} hrs/wk`
                      : 'No active profile configured yet. Create your personalized profile below.'}
                  </p>
                </div>
              </div>

              {/* Create Your Own Profile Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleQuery(null);
                  setResolvedRoleData(null);
                  setCurrentSection('home');
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-indigo)] via-[var(--accent-violet)] to-[var(--accent-pink)] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
                <span>+ Create Your Own Profile</span>
              </button>
            </div>

            {/* Profile Quick Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                  Target Role
                </span>
                <span className="text-sm font-bold text-[var(--text)] mt-1 block truncate">
                  {profile?.target_role || 'Not Set'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[var(--accent-indigo)]" />
                  Education
                </span>
                <span className="text-sm font-bold text-[var(--text)] mt-1 block truncate">
                  {profile ? `${profile.degree} · Yr ${profile.year}` : 'Not Set'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                  Commitment
                </span>
                <span className="text-sm font-bold text-[var(--text)] mt-1 block truncate">
                  {profile ? `${profile.available_hours_per_week} hrs/week` : '15 hrs/week'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Saved Student Profiles */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--accent-indigo)]" />
                <h3 className="text-sm font-bold font-display text-[var(--text)]">
                  Saved Student Profiles
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-elev-2)] text-[var(--text-muted)] border border-[var(--border)] font-semibold">
                  {savedProfiles.length}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Quick profile switcher
              </span>
            </div>

            {savedProfiles.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
                No extra saved profiles found. Generate or customize a roadmap to automatically persist your profile!
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedProfiles.map((p) => {
                  const isActive =
                    (profile?.id && p.id === profile.id) ||
                    (profile?.name === p.name && profile?.target_role === p.target_role);

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-[var(--accent-indigo)]/10 border-[var(--accent-indigo)] shadow-sm'
                          : 'bg-[var(--bg-elev-2)] border-[var(--border)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-elev-1)] border border-[var(--border)] overflow-hidden p-0.5 shrink-0">
                          <img
                            src={getCartoonAvatarUrl(p.avatar || p.name)}
                            alt="Avatar"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text)] truncate">
                              {p.name}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-semibold bg-[var(--accent-mint)]/15 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30 shrink-0">
                                Active Now
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            {p.target_role} · {p.degree} {p.branch} (Yr {p.year}) · {p.available_hours_per_week}h/wk
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              switchProfile(p.id);
                              toast.success(`Switched to ${p.name}'s profile (${p.target_role})`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[var(--bg-elev-1)] hover:bg-[var(--accent-indigo)] hover:text-white border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
                          >
                            Switch To Profile
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            deleteSavedProfile(p.id);
                            toast.info(`Removed ${p.name} from saved profiles`);
                          }}
                          className="p-1.5 rounded-xl text-[var(--color-critical)] hover:bg-[var(--color-critical)]/10 transition-colors cursor-pointer"
                          title="Delete saved profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


        </div>
      )}

      {/* Right Slide-Over Evidence Drawer (RAG Surface) */}
      <EvidenceDrawer
        isOpen={isEvidenceOpen}
        skillName={activeEvidenceSkill}
        gap={activeEvidenceGap}
        onClose={closeEvidence}
      />

      {/* Assessment Diagnostic Dialog (Quick Modal) */}
      <AssessmentDialog
        isOpen={isAssessmentOpen}
        skills={allCareerSkills}
        defaultSkill={targetAssessmentSkill || gaps.find((g) => g.priority === 'High')?.skill || allCareerSkills[0]?.name}
        onClose={() => {
          setTargetAssessmentSkill(null);
          closeAssessment();
        }}
        onApplyScore={handleApplyScore}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Export Plan & Share Modal */}
      <ExportShareModal
        isOpen={isExportOpen}
        onClose={() => setExportOpen(false)}
        onTriggerConfetti={() => setShowConfetti(true)}
      />
    </AppShell>
  );
};
