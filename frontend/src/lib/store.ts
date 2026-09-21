import { create } from 'zustand';
import type { StudentProfile, Skill, SkillGap, MarketRequirement, Roadmap, AssessmentResult } from './schemas';
import { fetchCompletedMilestones, updateMilestoneCompletion } from './api';

import { getRandomCartoonAvatar } from './avatar';

export type WorkflowTab = 'all' | 'profile' | 'gaps' | 'roadmap' | 'recalibration';

interface AppStore {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;

  avatar: string;
  setAvatar: (avatar: string) => void;
  randomizeAvatar: () => void;

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

  // Stage 2: Navigation Sections
  currentSection: SectionId;
  setCurrentSection: (section: SectionId) => void;

  // Session Reset
  clearSession: () => void;

  // Command Palette (cmdk)
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Shortcuts & Export Modals
  isShortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  toggleShortcuts: () => void;

  isExportOpen: boolean;
  setExportOpen: (open: boolean) => void;
  toggleExport: () => void;

  // Saved profiles & switching
  savedProfiles: SavedProfileSnapshot[];
  switchProfile: (profileId: string) => void;
  deleteSavedProfile: (profileId: string) => void;

  // Demo student pre-loader for instant exploration
  loadDemoStudent: () => void;
}

export type SectionId = 'home' | 'dashboard' | 'gaps' | 'roadmap' | 'assess' | 'progress' | 'resources' | 'settings';

export interface SavedProfileSnapshot {
  id: string;
  name: string;
  target_role: string;
  degree: string;
  branch: string;
  year: number;
  available_hours_per_week: number;
  avatar: string;
  updated_at: string;
  roadmap: Roadmap | null;
  gaps: SkillGap[];
  marketRequirements: MarketRequirement[];
}

const initialSkills: Skill[] = [];

interface PersistedSession {
  profile: StudentProfile | null;
  roadmap: Roadmap | null;
  gaps: SkillGap[];
  marketRequirements: MarketRequirement[];
  completedMilestones: Record<string, boolean>;
  currentSection: SectionId;
  savedProfiles: SavedProfileSnapshot[];
}

const loadPersistedSession = (): PersistedSession => {
  if (typeof window === 'undefined') {
    return {
      profile: null,
      roadmap: null,
      gaps: [],
      marketRequirements: [],
      completedMilestones: {},
      currentSection: 'home',
      savedProfiles: [],
    };
  }

  try {
    const rawProfile = localStorage.getItem('careerforge_profile');
    const rawRoadmap = localStorage.getItem('careerforge_roadmap');
    const rawGaps = localStorage.getItem('careerforge_gaps');
    const rawReqs = localStorage.getItem('careerforge_market_reqs');
    const rawMilestones = localStorage.getItem('careerforge_completed_milestones');
    const rawSection = localStorage.getItem('careerforge_current_section');
    const rawSavedProfiles = localStorage.getItem('careerforge_saved_profiles');

    let savedProfiles: SavedProfileSnapshot[] = [];
    if (rawSavedProfiles) {
      try {
        savedProfiles = JSON.parse(rawSavedProfiles);
      } catch {}
    }

    if (rawProfile) {
      const profile: StudentProfile = JSON.parse(rawProfile);
      const roadmap: Roadmap | null = rawRoadmap ? JSON.parse(rawRoadmap) : null;
      const gaps: SkillGap[] = rawGaps ? JSON.parse(rawGaps) : [];
      const marketRequirements: MarketRequirement[] = rawReqs ? JSON.parse(rawReqs) : [];
      const completedMilestones: Record<string, boolean> = rawMilestones ? JSON.parse(rawMilestones) : {};
      const validSection = (rawSection && rawSection !== 'home') ? (rawSection as SectionId) : (roadmap ? 'dashboard' : 'home');

      return {
        profile,
        roadmap,
        gaps,
        marketRequirements,
        completedMilestones,
        currentSection: validSection,
        savedProfiles,
      };
    }

    return {
      profile: null,
      roadmap: null,
      gaps: [],
      marketRequirements: [],
      completedMilestones: {},
      currentSection: 'home',
      savedProfiles,
    };
  } catch (err) {
    console.warn('Failed to hydrate session from localStorage:', err);
  }

  return {
    profile: null,
    roadmap: null,
    gaps: [],
    marketRequirements: [],
    completedMilestones: {},
    currentSection: 'home',
    savedProfiles: [],
  };
};

const saveSessionToStorage = (
  profile: StudentProfile | null,
  roadmap: Roadmap | null,
  gaps: SkillGap[],
  marketRequirements: MarketRequirement[],
  completedMilestones?: Record<string, boolean>,
  currentSection?: SectionId
) => {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      localStorage.setItem('careerforge_profile', JSON.stringify(profile));

      // Also upsert into savedProfiles list
      try {
        const rawSaved = localStorage.getItem('careerforge_saved_profiles');
        let list: SavedProfileSnapshot[] = rawSaved ? JSON.parse(rawSaved) : [];
        const profileName = profile.name || 'Student';
        const profileId = profile.id || profileName + '_' + profile.target_role;
        const existingIdx = list.findIndex((p) => p.id === profileId || (p.name === profileName && p.target_role === profile.target_role));

        const snapshot: SavedProfileSnapshot = {
          id: profileId,
          name: profileName,
          target_role: profile.target_role,
          degree: profile.degree,
          branch: profile.branch,
          year: profile.year,
          available_hours_per_week: profile.available_hours_per_week,
          avatar: profile.avatar || 'bottts',
          updated_at: new Date().toISOString(),
          roadmap,
          gaps,
          marketRequirements,
        };

        if (existingIdx >= 0) {
          list[existingIdx] = snapshot;
        } else {
          list.unshift(snapshot);
        }
        localStorage.setItem('careerforge_saved_profiles', JSON.stringify(list.slice(0, 10)));
      } catch (e) {
        console.warn('Failed to update saved profiles list:', e);
      }
    } else {
      localStorage.removeItem('careerforge_profile');
    }

    if (roadmap) {
      localStorage.setItem('careerforge_roadmap', JSON.stringify(roadmap));
    } else {
      localStorage.removeItem('careerforge_roadmap');
    }
    if (gaps && gaps.length > 0) {
      localStorage.setItem('careerforge_gaps', JSON.stringify(gaps));
    } else {
      localStorage.removeItem('careerforge_gaps');
    }
    if (marketRequirements && marketRequirements.length > 0) {
      localStorage.setItem('careerforge_market_reqs', JSON.stringify(marketRequirements));
    } else {
      localStorage.removeItem('careerforge_market_reqs');
    }
    if (completedMilestones) {
      localStorage.setItem('careerforge_completed_milestones', JSON.stringify(completedMilestones));
    }
    if (currentSection) {
      localStorage.setItem('careerforge_current_section', currentSection);
    }
  } catch (err) {
    console.warn('Failed to save session to localStorage:', err);
  }
};

const initialSession = loadPersistedSession();

export const useAppStore = create<AppStore>((set, get) => ({
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

  avatar: (typeof window !== 'undefined' && localStorage.getItem('careerforge_avatar')) || 'cyber-neon',
  setAvatar: (avatar) => {
    localStorage.setItem('careerforge_avatar', avatar);
    set({ avatar });
  },
  randomizeAvatar: () => {
    const next = getRandomCartoonAvatar();
    localStorage.setItem('careerforge_avatar', next.id);
    set({ avatar: next.id });
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

  profile: initialSession.profile,
  marketRequirements: initialSession.marketRequirements,
  gaps: initialSession.gaps,
  roadmap: initialSession.roadmap,
  previousRoadmap: null,

  skills: initialSession.profile ? initialSession.profile.skills : initialSkills,
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

  completedMilestones: initialSession.completedMilestones,
  toggleMilestone: (phaseNumber, index) => {
    const key = `${phaseNumber}-${index}`;
    const state = get();
    const nextVal = !state.completedMilestones[key];
    const nextCompleted = {
      ...state.completedMilestones,
      [key]: nextVal,
    };

    // Optimistic local state update
    set({
      completedMilestones: nextCompleted,
    });
    saveSessionToStorage(
      state.profile,
      state.roadmap,
      state.gaps,
      state.marketRequirements,
      nextCompleted,
      state.currentSection
    );

    // Background sync to backend persistence if profile exists
    const profileId = state.profile?.id;
    if (profileId && !profileId.startsWith('demo-')) {
      updateMilestoneCompletion(profileId, key, nextVal).catch((err) =>
        console.warn('Failed to persist milestone completion:', err)
      );
    }
  },

  isAssessmentOpen: false,
  openAssessment: () => set({ isAssessmentOpen: true }),
  closeAssessment: () => set({ isAssessmentOpen: false }),

  activeEvidenceSkill: null,
  isEvidenceOpen: false,
  openEvidence: (skill) => set({ activeEvidenceSkill: skill, isEvidenceOpen: true }),
  closeEvidence: () => set({ isEvidenceOpen: false }),

  lastAssessmentResult: null,
  lastAssessmentSummary: null,

  setInitialPlan: ({ profile, marketRequirements, gaps, roadmap }) => {
    saveSessionToStorage(
      profile,
      roadmap,
      gaps,
      marketRequirements,
      get().completedMilestones,
      'dashboard'
    );

    const rawSaved = typeof window !== 'undefined' ? localStorage.getItem('careerforge_saved_profiles') : null;
    let nextSavedProfiles = get().savedProfiles;
    if (rawSaved) {
      try {
        nextSavedProfiles = JSON.parse(rawSaved);
      } catch {}
    }

    set({
      profile,
      marketRequirements,
      gaps,
      roadmap,
      previousRoadmap: null,
      skills: profile.skills,
      currentSection: 'dashboard',
      savedProfiles: nextSavedProfiles,
    });

    if (profile.id && !profile.id.startsWith('demo-')) {
      fetchCompletedMilestones(profile.id)
        .then((milestones) => {
          if (milestones && Object.keys(milestones).length > 0) {
            set({ completedMilestones: milestones });
            saveSessionToStorage(
              profile,
              roadmap,
              gaps,
              marketRequirements,
              milestones,
              'dashboard'
            );
          }
        })
        .catch(() => {});
    }
  },

  applyAdaptedPlan: ({ result, updatedProfile, gaps, roadmap, summary }) =>
    set((state) => {
      const updated = updatedProfile ?? state.profile;
      saveSessionToStorage(
        updated,
        roadmap,
        gaps,
        state.marketRequirements,
        state.completedMilestones,
        state.currentSection
      );

      const rawSaved = typeof window !== 'undefined' ? localStorage.getItem('careerforge_saved_profiles') : null;
      let nextSavedProfiles = state.savedProfiles;
      if (rawSaved) {
        try {
          nextSavedProfiles = JSON.parse(rawSaved);
        } catch {}
      }

      return {
        previousRoadmap: state.roadmap,
        roadmap,
        gaps,
        profile: updated,
        skills: updated ? updated.skills : state.skills,
        lastAssessmentResult: result,
        lastAssessmentSummary: summary,
        isAssessmentOpen: false,
        savedProfiles: nextSavedProfiles,
      };
    }),

  currentSection: initialSession.currentSection,
  setCurrentSection: (section) => {
    localStorage.setItem('careerforge_current_section', section);
    set({ currentSection: section });
  },

  savedProfiles: initialSession.savedProfiles,

  switchProfile: (profileId: string) => {
    const state = get();
    const target = state.savedProfiles.find((p) => p.id === profileId);
    if (!target) return;

    const switchedProfile: StudentProfile = {
      id: target.id,
      name: target.name,
      degree: target.degree,
      branch: target.branch,
      year: target.year,
      target_role: target.target_role,
      available_hours_per_week: target.available_hours_per_week,
      current_prep_level: 'intermediate',
      skills: target.roadmap?.phases.flatMap((p) => p.skills_covered.map((s) => ({ name: s, proficiency: 2.0 }))) || [],
      avatar: target.avatar,
    };

    saveSessionToStorage(
      switchedProfile,
      target.roadmap,
      target.gaps,
      target.marketRequirements,
      {},
      'dashboard'
    );

    set({
      profile: switchedProfile,
      roadmap: target.roadmap,
      gaps: target.gaps,
      marketRequirements: target.marketRequirements,
      skills: switchedProfile.skills,
      completedMilestones: {},
      currentSection: 'dashboard',
      previousRoadmap: null,
      avatar: target.avatar,
    });
  },

  deleteSavedProfile: (profileId: string) => {
    const state = get();
    const updated = state.savedProfiles.filter((p) => p.id !== profileId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerforge_saved_profiles', JSON.stringify(updated));
    }
    set({ savedProfiles: updated });
  },

  clearSession: () => {
    saveSessionToStorage(null, null, [], [], {}, 'home');
    set({
      profile: null,
      roadmap: null,
      gaps: [],
      marketRequirements: [],
      completedMilestones: {},
      currentSection: 'home',
      skills: initialSkills,
      previousRoadmap: null,
    });
  },

  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  isShortcutsOpen: false,
  setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),
  toggleShortcuts: () => set((state) => ({ isShortcutsOpen: !state.isShortcutsOpen })),

  isExportOpen: false,
  setExportOpen: (open) => set({ isExportOpen: open }),
  toggleExport: () => set((state) => ({ isExportOpen: !state.isExportOpen })),

  loadDemoStudent: () => {
    const demoProfile: StudentProfile = {
      id: 'demo-student-aarav',
      name: 'Aarav Sharma',
      degree: 'B.Tech',
      branch: 'Computer Science',
      year: 3,
      target_role: 'Backend Engineer',
      available_hours_per_week: 15,
      current_prep_level: 'intermediate',
      skills: [
        { name: 'Python', proficiency: 3.0 },
        { name: 'SQL', proficiency: 2.0 },
        { name: 'Docker', proficiency: 1.5 },
        { name: 'System Design', proficiency: 1.0 },
        { name: 'Git', proficiency: 3.0 },
      ],
    };

    const demoMarket = [
      { skill: 'Python', required_level: 4.0, demand_level: 'critical', source_url: 'https://docs.python.org/3/', notes: 'Core runtime and data structures' },
      { skill: 'SQL', required_level: 3.5, demand_level: 'critical', source_url: 'https://www.postgresql.org/docs/current/', notes: 'Complex joins and indexing' },
      { skill: 'Docker', required_level: 3.0, demand_level: 'high-priority', source_url: 'https://docs.docker.com/', notes: 'Multi-stage builds and compose' },
      { skill: 'System Design', required_level: 3.5, demand_level: 'critical', source_url: 'https://github.com/donnemartin/system-design-primer', notes: 'Distributed cache & concurrency' },
      { skill: 'Git', required_level: 3.0, demand_level: 'frequently mentioned', source_url: 'https://git-scm.com/doc', notes: 'Branching and merge conflict resolution' },
    ];

    const demoGaps: SkillGap[] = [
      { skill: 'System Design', current_level: 1.0, required_level: 3.5, gap: 2.5, priority: 'High', demand_level: 'critical', reasoning: 'Key architectural requirement' },
      { skill: 'SQL', current_level: 2.0, required_level: 3.5, gap: 1.5, priority: 'High', demand_level: 'critical', reasoning: 'Persistence & complex queries' },
      { skill: 'Docker', current_level: 1.5, required_level: 3.0, gap: 1.5, priority: 'High', demand_level: 'high-priority', reasoning: 'Containerization & local stacks' },
      { skill: 'Python', current_level: 3.0, required_level: 4.0, gap: 1.0, priority: 'Medium', demand_level: 'critical', reasoning: 'Async runtime & design patterns' },
      { skill: 'Git', current_level: 3.0, required_level: 3.0, gap: 0.0, priority: 'Mastered', demand_level: 'frequently mentioned', reasoning: 'Already proficient' },
    ];

    const demoRoadmap: Roadmap = {
      profile_id: 'demo-student-aarav',
      target_role: 'Backend Engineer',
      total_estimated_hours: 99,
      available_hours_per_week: 15,
      estimated_weeks: 7,
      version: 2.0,
      phases: [
        {
          phase_number: 1,
          title: 'Foundations & Database Mastery',
          estimated_hours: 38,
          skills_covered: ['SQL', 'Python'],
          learning_objectives: ['Master EXPLAIN ANALYZE', 'Implement B-Tree & GIN indexes', 'Write window functions & CTEs'],
          status: 'in_progress',
          resources: [
            {
              title: 'SQL Relational DB Prep Guide',
              url_or_ref: 'Curated SQL Relational Database Guide',
              resource_type: 'guide',
            },
          ],
        },
        {
          phase_number: 2,
          title: 'Containerization & System Architecture',
          estimated_hours: 61,
          skills_covered: ['Docker', 'System Design'],
          learning_objectives: ['Alpine minimal container builds', 'Cache-aside with Redis', 'Database read-replicas'],
          status: 'not_started',
          resources: [
            {
              title: 'Docker & Cloud DevOps Prep Guide',
              url_or_ref: 'Curated Docker & Cloud DevOps Guide',
              resource_type: 'guide',
            },
          ],
        },
      ],
    };

    saveSessionToStorage(
      demoProfile,
      demoRoadmap,
      demoGaps,
      demoMarket,
      {},
      'dashboard'
    );

    set({
      profile: demoProfile,
      marketRequirements: demoMarket,
      gaps: demoGaps,
      roadmap: demoRoadmap,
      previousRoadmap: null,
      skills: demoProfile.skills,
      currentSection: 'dashboard',
    });
  },
}));
