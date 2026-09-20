import { create } from 'zustand';
import type { StudentProfile, Skill, SkillGap, MarketRequirement, Roadmap, AssessmentResult } from './schemas';

export type WorkflowTab = 'all' | 'profile' | 'gaps' | 'roadmap' | 'recalibration';

interface AppStore {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;

  presenterMode: boolean;
  togglePresenterMode: () => void;

  showParticles: boolean;
  toggleParticles: () => void;

  activeTab: WorkflowTab;
  setActiveTab: (tab: WorkflowTab) => void;

  profile: StudentProfile | null;
  marketRequirements: MarketRequirement[];
  gaps: SkillGap[];
  roadmap: Roadmap | null;
  previousRoadmap: Roadmap | null;

  skills: Skill[];
  setSkills: (s: Skill[]) => void;
  updateSkillProficiency: (idx: number, val: number) => void;
  addSkill: (name: string, proficiency?: number) => void;
  removeSkill: (idx: number) => void;

  // Milestone checklists: key is `${phaseNumber}-${milestoneIndex}`
  completedMilestones: Record<string, boolean>;
  toggleMilestone: (phaseNumber: number, index: number) => void;

  // Modals & Drawers
  isAssessmentOpen: boolean;
  openAssessment: () => void;
  closeAssessment: () => void;

  activeEvidenceSkill: string | null;
  isEvidenceOpen: boolean;
  openEvidence: (skill: string) => void;
  closeEvidence: () => void;

  lastAssessmentResult: AssessmentResult | null;
  lastAssessmentSummary: string | null;

  // Whole dataset update
  setInitialPlan: (data: {
    profile: StudentProfile;
    marketRequirements: MarketRequirement[];
    gaps: SkillGap[];
    roadmap: Roadmap;
  }) => void;

  applyAdaptedPlan: (data: {
    result: AssessmentResult;
    updatedProfile?: StudentProfile | null;
    gaps: SkillGap[];
    roadmap: Roadmap;
    summary: string;
  }) => void;
}

const initialSkills: Skill[] = [
  { name: 'Python', proficiency: 2.5 },
  { name: 'SQL', proficiency: 1.5 },
  { name: 'Docker', proficiency: 1.0 },
  { name: 'System Design', proficiency: 0.5 },
];

export const useAppStore = create<AppStore>((set) => ({
  theme: (typeof window !== 'undefined' && localStorage.getItem('careerforge_theme') === 'light') ? 'light' : 'dark',
  setTheme: (theme) => {
    localStorage.setItem('careerforge_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('careerforge_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      return { theme: next };
    });
  },

  presenterMode: false,
  togglePresenterMode: () => {
    set((state) => {
      const next = !state.presenterMode;
      document.body.classList.toggle('presenter-mode', next);
      return { presenterMode: next };
    });
  },

  showParticles: true,
  toggleParticles: () => set((state) => ({ showParticles: !state.showParticles })),

  activeTab: 'all',
  setActiveTab: (activeTab) => set({ activeTab }),

  profile: null,
  marketRequirements: [],
  gaps: [],
  roadmap: null,
  previousRoadmap: null,

  skills: initialSkills,
  setSkills: (skills) => set({ skills }),
  updateSkillProficiency: (idx, val) =>
    set((state) => {
      const next = [...state.skills];
      if (next[idx]) {
        next[idx] = { ...next[idx], proficiency: Math.max(0, Math.min(5, Math.round(val * 10) / 10)) };
      }
      return { skills: next };
    }),
  addSkill: (name, proficiency = 1.0) =>
    set((state) => {
      if (state.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        return state;
      }
      return { skills: [...state.skills, { name, proficiency }] };
    }),
  removeSkill: (idx) =>
    set((state) => {
      const next = [...state.skills];
      next.splice(idx, 1);
      return { skills: next };
    }),

  completedMilestones: {},
  toggleMilestone: (phaseNumber, index) =>
    set((state) => {
      const key = `${phaseNumber}-${index}`;
      return {
        completedMilestones: {
          ...state.completedMilestones,
          [key]: !state.completedMilestones[key],
        },
      };
    }),

  isAssessmentOpen: false,
  openAssessment: () => set({ isAssessmentOpen: true }),
  closeAssessment: () => set({ isAssessmentOpen: false }),

  activeEvidenceSkill: null,
  isEvidenceOpen: false,
  openEvidence: (skill) => set({ activeEvidenceSkill: skill, isEvidenceOpen: true }),
  closeEvidence: () => set({ isEvidenceOpen: false }),

  lastAssessmentResult: null,
  lastAssessmentSummary: null,

  setInitialPlan: ({ profile, marketRequirements, gaps, roadmap }) =>
    set({
      profile,
      marketRequirements,
      gaps,
      roadmap,
      previousRoadmap: null,
      skills: profile.skills,
    }),

  applyAdaptedPlan: ({ result, updatedProfile, gaps, roadmap, summary }) =>
    set((state) => ({
      previousRoadmap: state.roadmap,
      roadmap,
      gaps,
      profile: updatedProfile ?? state.profile,
      skills: updatedProfile ? updatedProfile.skills : state.skills,
      lastAssessmentResult: result,
      lastAssessmentSummary: summary,
      isAssessmentOpen: false,
    })),
}));
