import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../lib/store';
import {
  Home,
  LayoutDashboard,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const { currentSection, setCurrentSection, roadmap, gaps } = useAppStore();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, badge: null },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: roadmap ? `${roadmap.estimated_weeks}w` : null },
    { id: 'gaps', label: 'Skill Gaps', icon: Activity, badge: gaps.length > 0 ? `${gaps.length}` : null },
    { id: 'roadmap', label: 'Roadmap', icon: Layers, badge: roadmap ? `v${roadmap.version}` : null },
    { id: 'assess', label: 'Assess', icon: Sparkles, badge: 'Live' },
    { id: 'progress', label: 'Progress', icon: TrendingUp, badge: null },
    { id: 'resources', label: 'Resources', icon: BookOpen, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ] as const;

  return (
    <>
      {/* Desktop Left Sidebar (> 768px) */}
      <aside
        className={`hidden md:flex flex-col border-r border-b border-[var(--border)] bg-[var(--bg-elev-1)]/95 backdrop-blur-md rounded-br-3xl shadow-sm transition-all duration-300 select-none z-30 h-full shrink-0 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentSection(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer group ${
                  isActive
                    ? 'text-[var(--text)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)]'
                }`}
              >
                {/* Motion Animated Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-[var(--accent-indigo)]/15 border border-[var(--accent-indigo)]/30"
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center shrink-0">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-[var(--accent-indigo)]' : 'text-[var(--text-muted)]'
                    }`}
                  />
                </span>

                {!isCollapsed && (
                  <div className="relative z-10 flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-[var(--accent-indigo)] text-white'
                            : 'bg-[var(--bg-elev-2)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse Toggle Button */}
        <div className="p-3 border-t border-[var(--border)] rounded-br-3xl">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-2xl text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)] transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--glass-bg)] backdrop-blur-lg border-t border-[var(--border)] px-2 py-1.5 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentSection(item.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-[var(--accent-indigo)] font-bold' : 'text-[var(--text-muted)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-active"
                  className="absolute inset-0 rounded-lg bg-[var(--accent-indigo)]/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                />
              )}
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
