import React from 'react';
import { useAppStore, type WorkflowTab } from '../../lib/store';
import { User, Activity, Layers, Sparkles, LayoutGrid } from 'lucide-react';

export const WorkflowNav: React.FC = () => {
  const { activeTab, setActiveTab, profile, gaps, roadmap } = useAppStore();

  const tabs: { id: WorkflowTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'all',
      label: 'All Workstation',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
    },
    {
      id: 'profile',
      label: '1. Profile & Skills',
      icon: <User className="w-3.5 h-3.5" />,
      badge: profile ? '✓ Set' : 'Start',
    },
    {
      id: 'gaps',
      label: '2. Skill Gap Matrix',
      icon: <Activity className="w-3.5 h-3.5" />,
      badge: gaps.length > 0 ? `${gaps.length} Gaps` : undefined,
    },
    {
      id: 'roadmap',
      label: '3. Phased Roadmap',
      icon: <Layers className="w-3.5 h-3.5" />,
      badge: roadmap ? `${roadmap.phases.length} Phases` : undefined,
    },
    {
      id: 'recalibration',
      label: '4. Adaptation Studio',
      icon: <Sparkles className="w-3.5 h-3.5 text-[var(--neon-cyan)]" />,
      badge: roadmap ? `v${roadmap.version}` : 'Diagnostic',
    },
  ];

  return (
    <div className="w-full bg-[var(--glass-bg)] border-b border-[var(--border-subtle)] px-6 py-2 sticky top-14 z-20 backdrop-blur-md overflow-x-auto select-none">
      <div className="flex items-center gap-2 max-w-[1360px] mx-auto min-w-max">
        <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mr-2 hidden md:inline">
          Workflow:
        </span>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'all') {
                  const el = document.getElementById(`${tab.id}-section`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }}
              className={`h-8 px-3 rounded-full text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                  : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--bg-sunken)] text-[var(--neon-cyan)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
