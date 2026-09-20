import React, { useEffect } from 'react';
import { Command } from 'cmdk';
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
  Sun,
  Moon,
  Download,
  X,
  Keyboard,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setCurrentSection,
    theme,
    toggleTheme,
    openAssessment,
    setShortcutsOpen,
    toggleShortcuts,
    setExportOpen,
    toggleExport,
  } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Command palette: Cmd+K / Ctrl+K
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShortcutsOpen(false);
        setCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      // Ignore single character shortcuts when typing inside form inputs
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (e.target as HTMLElement)?.tagName
      );
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        toggleShortcuts();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setShortcutsOpen(false);
        openAssessment();
        toast.info('Quick Assessment opened (Shortcut: L)');
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setShortcutsOpen(false);
        toggleExport();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setShortcutsOpen(false);
        toggleTheme();
        toast.info(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} theme`);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShortcutsOpen(false);
        setCurrentSection('home');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setShortcutsOpen(false);
        setCurrentSection('dashboard');
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setShortcutsOpen(false);
        setCurrentSection('gaps');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShortcutsOpen(false);
        setCurrentSection('roadmap');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setShortcutsOpen(false);
        setCurrentSection('progress');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    openAssessment,
    toggleShortcuts,
    toggleExport,
    toggleTheme,
    setCurrentSection,
    theme,
  ]);

  if (!isCommandPaletteOpen) return null;

  const navigateTo = (section: any) => {
    setCurrentSection(section);
    setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elev-1)] shadow-2xl overflow-hidden">
        <Command className="w-full bg-transparent text-[var(--text)]">
          <div className="flex items-center px-4 border-b border-[var(--border)]">
            <Command.Input
              placeholder="Type a command or search sections... (ESC to close)"
              className="w-full h-14 bg-transparent text-sm placeholder-[var(--text-muted)] focus:outline-none font-body"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(false)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 text-sm">
            <Command.Empty className="p-4 text-center text-xs text-[var(--text-muted)] font-mono">
              No matching commands found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-semibold text-[var(--text-faint)] px-2 py-1 uppercase tracking-wider">
              <Command.Item
                onSelect={() => navigateTo('home')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Home className="w-4 h-4 text-[var(--accent-sky)]" />
                <span>Search Home & Role Resolver (H)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('dashboard')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <LayoutDashboard className="w-4 h-4 text-[var(--accent-indigo)]" />
                <span>Mission Control Dashboard (D)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('gaps')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Activity className="w-4 h-4 text-[var(--accent-pink)]" />
                <span>Skill Gap Matrix & Heatmap (G)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('roadmap')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Layers className="w-4 h-4 text-[var(--accent-amber)]" />
                <span>Adaptive Phased Roadmap (R)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('assess')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Sparkles className="w-4 h-4 text-[var(--accent-sky)]" />
                <span>Recalibration Studio & Evaluation History</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('progress')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <TrendingUp className="w-4 h-4 text-[var(--accent-mint)]" />
                <span>Progress & Readiness Analytics (P)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('resources')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <BookOpen className="w-4 h-4 text-[var(--accent-sky)]" />
                <span>Curated Study Guides & Documentation</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('settings')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                <span>Profile Settings & Constraints</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions & Tools" className="text-xs font-semibold text-[var(--text-faint)] px-2 pt-3 pb-1 uppercase tracking-wider">
              <Command.Item
                onSelect={() => {
                  setCommandPaletteOpen(false);
                  setExportOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Download className="w-4 h-4 text-[var(--accent-mint)]" />
                <span>Export Plan (Markdown / PDF / JSON) (E)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setCommandPaletteOpen(false);
                  setExportOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Share2 className="w-4 h-4 text-[var(--accent-sky)]" />
                <span>Copy Shareable Plan Link</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setCommandPaletteOpen(false);
                  setShortcutsOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Keyboard className="w-4 h-4 text-[var(--accent-purple)]" />
                <span>View Keyboard Shortcuts Help (?)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  toggleTheme();
                  toast.success(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} mode`);
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--accent-amber)]" /> : <Moon className="w-4 h-4 text-[var(--accent-indigo)]" />}
                <span>Toggle Theme (T)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setCommandPaletteOpen(false);
                  openAssessment();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[var(--text)] aria-selected:bg-[var(--accent-indigo)] aria-selected:text-white"
              >
                <Sparkles className="w-4 h-4 text-[var(--accent-sky)]" />
                <span>Quick Log Assessment (L)</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-elev-2)] border-t border-[var(--border)] text-xs text-[var(--text-muted)] font-mono">
            <span>Navigation: ↑ ↓ · Select: ↵ · Hotkeys: ?, L, E, T</span>
            <span>CareerForge AI Command Engine</span>
          </div>
        </Command>
      </div>
    </div>
  );
};
