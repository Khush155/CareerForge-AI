import React, { useState, useEffect } from 'react';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';
import '../styles/tokens.css';
import '../styles/theme.css';

import { SideRail } from '../components/layout/SideRail';
import { TopBar } from '../components/layout/TopBar';
import { WorkflowNav } from '../components/layout/WorkflowNav';
import { ProfileForm } from '../features/profile/ProfileForm';
import { GapMatrix } from '../components/domain/GapMatrix';
import { BudgetStrip, type BudgetSegment } from '../components/domain/BudgetStrip';
import { RoadmapTimeline } from '../components/domain/RoadmapTimeline';
import { DiffStrip } from '../components/domain/DiffStrip';
import { AssessmentDialog } from '../components/domain/AssessmentDialog';
import { EvidenceDrawer } from '../components/domain/EvidenceDrawer';
import { AdaptationStudio } from '../components/domain/AdaptationStudio';
import { NeuralBackground } from '../components/3d/NeuralBackground';
import { ConfettiBurst } from '../components/3d/ConfettiBurst';

import { useAppStore } from '../lib/store';
import { submitProfile, submitAssessment } from '../lib/api';
import type { StudentProfile } from '../lib/schemas';
import { Activity, Layers, ShieldCheck, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const {
    profile,
    roadmap,
    previousRoadmap,
    gaps,
    skills,
    activeTab,
    isAssessmentOpen,
    openAssessment,
    closeAssessment,
    isEvidenceOpen,
    activeEvidenceSkill,
    openEvidence,
    closeEvidence,
    lastAssessmentResult,
    lastAssessmentSummary,
    setInitialPlan,
    applyAdaptedPlan,
    toggleTheme,
    togglePresenterMode,
  } = useAppStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [highlightedSkill, setHighlightedSkill] = useState<string | null>(null);
  const [changedPhases, setChangedPhases] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        togglePresenterMode();
        showToast('Presenter mode toggled (18px text, reinforced borders)');
        return;
      }

      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        openAssessment();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (gaps.length > 0) openEvidence(gaps[0].skill);
      } else if (e.key === '?') {
        e.preventDefault();
        showToast('Shortcuts: L (Log score), E (Evidence), T (Theme), Shift+P (Presenter mode)');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gaps, openAssessment, openEvidence, toggleTheme, togglePresenterMode]);

  // Handle Initial Profile Submission
  const handleProfileSubmit = async (formData: Partial<StudentProfile>) => {
    try {
      setIsGenerating(true);
      setGenerationStage('Researching benchmarks');

      const stageTimer1 = setTimeout(() => setGenerationStage('Computing gaps'), 300);
      const stageTimer2 = setTimeout(() => setGenerationStage('Retrieving guides'), 600);
      const stageTimer3 = setTimeout(() => setGenerationStage('Budgeting phases'), 900);

      const response = await submitProfile(formData);

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      setInitialPlan({
        profile: response.profile,
        marketRequirements: response.market_requirements,
        gaps: response.gaps,
        roadmap: response.roadmap,
      });

      showToast('Personalized adaptive roadmap synthesized successfully!');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  // Handle Assessment Submission & Choreography
  const handleApplyScore = async (skill: string, score: number) => {
    if (!profile?.id) {
      alert('Please generate a roadmap first before applying an assessment score.');
      return;
    }

    try {
      const response = await submitAssessment({
        profile_id: profile.id,
        skill,
        score_percentage: score,
        notes: 'Assessment applied via CareerForge precision instrument',
      });

      // Dismiss modal if open
      closeAssessment();

      // Trigger celebratory particle explosion
      setShowConfetti(true);

      // Apply adapted plan
      applyAdaptedPlan({
        result: response.result,
        updatedProfile: response.updated_profile,
        gaps: response.gaps,
        roadmap: response.roadmap,
        summary: response.summary,
      });

      // Highlight phases covering the adapted skill for 700ms wash
      const affected = response.roadmap.phases
        .filter((p) => p.skills_covered.includes(skill))
        .map((p) => p.phase_number);
      setChangedPhases(affected);
      setTimeout(() => setChangedPhases([]), 700);

      showToast(`Score logged! Dynamic roadmap adapted to Revision v${response.roadmap.version}.`);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Compute Bandwidth Allocation Segments
  const budgetSegments: BudgetSegment[] = [];
  if (roadmap) {
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

  // Copy Summary Markdown Export
  const handleCopySummary = () => {
    if (!profile || !roadmap) {
      showToast('Generate a roadmap first to copy run summary.');
      return;
    }

    const lines = [
      `# CareerForge AI — Run Summary`,
      `- **Student:** ${profile.name} (${profile.degree} ${profile.branch}, Year ${profile.year})`,
      `- **Target Role:** ${profile.target_role}`,
      `- **Roadmap Revision:** v${roadmap.version}`,
      `- **Total Hours:** ${roadmap.total_estimated_hours} h (~${roadmap.estimated_weeks} weeks at ${roadmap.available_hours_per_week} h/wk)`,
      ``,
      `## Skill Gaps`,
      `| Skill | Current | Benchmark | Gap | Priority |`,
      `| :--- | :--- | :--- | :--- | :--- |`,
      ...gaps.map((g) => `| ${g.skill} | ${g.current_level.toFixed(1)} | ${g.required_level.toFixed(1)} | ${g.gap.toFixed(1)} | ${g.priority} |`),
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      showToast('Run summary copied to clipboard.');
    });
  };

  const activeEvidenceGap = gaps.find(
    (g) => g.skill.toLowerCase() === (activeEvidenceSkill || '').toLowerCase()
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] relative overflow-x-hidden cyber-bg-grid font-sans">
      {/* 60fps Interactive HTML5 Canvas Neural Constellation */}
      <NeuralBackground />

      {/* Celebratory Adaptation Confetti Burst */}
      <ConfettiBurst trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Side Rail Navigation (256px) */}
      <SideRail
        version={roadmap?.version || 1}
        onOpenAssessment={openAssessment}
      />

      {/* Main Fluid Workstation Canvas */}
      <div className="ml-64 flex-1 flex flex-col min-w-0 max-lg:ml-16 max-md:ml-0 max-md:mb-16 relative z-10">
        {/* Top Bar with Telemetry HUD */}
        <TopBar
          profile={profile}
          version={roadmap?.version || 1}
          onCopySummary={handleCopySummary}
        />

        {/* Interactive Workflow Navigation Stepper */}
        <WorkflowNav />

        {/* Fluid Scrollable Content */}
        <main className="max-w-[1360px] w-full mx-auto p-8 max-md:p-4 flex flex-col gap-14">
          {/* Section 1: Profile & Target Configuration */}
          {(activeTab === 'all' || activeTab === 'profile') && (
            <ProfileForm
              onSubmit={handleProfileSubmit}
              isGenerating={isGenerating}
              stageName={generationStage}
            />
          )}

          {activeTab === 'all' && <hr className="border-0 h-px bg-[var(--border-subtle)]" />}

          {/* Section 2: Deterministic Skill Gap Matrix */}
          {(activeTab === 'all' || activeTab === 'gaps') && (
            <section id="gaps-section" aria-labelledby="gaps-heading" className="flex flex-col gap-4">
              <div className="flex justify-between items-baseline flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 flex items-center justify-center text-[var(--neon-cyan)]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="gaps-heading" className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
                      Skill Gap Matrix & Benchmark Comparison
                    </h2>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      Pure Python math: gap = max(0, required − current)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--neon-emerald)]/10 border border-[var(--neon-emerald)]/30 font-mono text-xs font-bold text-[var(--neon-emerald)]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    0.00% Math Drift
                  </span>
                </div>
              </div>

              <GapMatrix
                gaps={gaps}
                onSelectSkill={(skill) => openEvidence(skill)}
              />
            </section>
          )}

          {/* Pinned Adaptation Diff Strip */}
          {lastAssessmentResult && lastAssessmentSummary && (
            <DiffStrip
              fromVersion={previousRoadmap ? previousRoadmap.version : 1}
              toVersion={roadmap ? roadmap.version : 2}
              result={lastAssessmentResult}
              summary={lastAssessmentSummary}
              onDismiss={() => useAppStore.setState({ lastAssessmentResult: null })}
            />
          )}

          {activeTab === 'all' && <hr className="border-0 h-px bg-[var(--border-subtle)]" />}

          {/* Section 3: Adaptive Phased Roadmap Timeline */}
          {(activeTab === 'all' || activeTab === 'roadmap') && (
            <section id="roadmap-section" aria-labelledby="roadmap-heading" className="flex flex-col gap-6">
              <div className="flex justify-between items-baseline flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--neon-violet)]/10 border border-[var(--neon-violet)]/30 flex items-center justify-center text-[var(--neon-violet)]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="roadmap-heading" className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
                      Adaptive Phased Roadmap & Curriculum
                    </h2>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {roadmap ? `${roadmap.total_estimated_hours} total hours · ${roadmap.phases.length} sequential execution stages` : 'Phased execution timeline'}
                    </span>
                  </div>
                </div>

                {roadmap && (
                  <span className="font-mono text-xs font-bold text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 px-3 py-1 rounded-full border border-[var(--neon-cyan)]/30">
                    Dynamic Revision v{roadmap.version}
                  </span>
                )}
              </div>

              {/* Bandwidth Budget Allocator */}
              <BudgetStrip
                segments={budgetSegments}
                totalHours={roadmap?.total_estimated_hours || 0}
                weeklyHours={roadmap?.available_hours_per_week || 20}
                onHoverSegment={setHighlightedSkill}
              />

              {/* Phased Roadmap Sequence */}
              <RoadmapTimeline
                phases={roadmap?.phases || []}
                gaps={gaps}
                weeklyHours={roadmap?.available_hours_per_week || 20}
                highlightedSkill={highlightedSkill}
                onOpenResource={(title) => openEvidence(title)}
                changedPhases={changedPhases}
              />
            </section>
          )}

          {activeTab === 'all' && <hr className="border-0 h-px bg-[var(--border-subtle)]" />}

          {/* Section 4: Live Recalibration Studio */}
          {(activeTab === 'all' || activeTab === 'recalibration') && (
            <AdaptationStudio onApplyScore={handleApplyScore} />
          )}
        </main>
      </div>

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
        skills={skills}
        defaultSkill={gaps.find((g) => g.priority === 'High')?.skill || skills[0]?.name}
        onClose={closeAssessment}
        onApplyScore={handleApplyScore}
      />

      {/* Cyber Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 glass-panel rounded-2xl border border-[var(--neon-cyan)]/40 px-5 py-3 text-xs font-mono font-medium text-[var(--text-primary)] shadow-[0_0_20px_rgba(0,242,254,0.3)] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--neon-cyan)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
