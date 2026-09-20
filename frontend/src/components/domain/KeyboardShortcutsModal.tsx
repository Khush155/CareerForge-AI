import React, { useEffect } from 'react';
import { X, Command, Keyboard } from 'lucide-react';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  items: ShortcutItem[];
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    category: 'Global Navigation',
    items: [
      { keys: ['H'], description: 'Jump to Search Home & Role Resolution' },
      { keys: ['D'], description: 'Open Mission Control Dashboard' },
      { keys: ['G'], description: 'Inspect Skill Gap Matrix & Heatmap' },
      { keys: ['R'], description: 'View Phased Roadmap (Timeline / Kanban)' },
      { keys: ['P'], description: 'Open Readiness & Velocity Analytics' },
    ],
  },
  {
    category: 'Core Actions & Modals',
    items: [
      { keys: ['⌘', 'K'], description: 'Open Command Palette' },
      { keys: ['L'], description: 'Launch Quick Assessment Diagnostic' },
      { keys: ['E'], description: 'Export Plan (Markdown / PDF / JSON / Link)' },
      { keys: ['T'], description: 'Toggle Dark / Light Theme' },
      { keys: ['?'], description: 'Show Keyboard Shortcuts Help' },
      { keys: ['ESC'], description: 'Close active modal, drawer, or palette' },
    ],
  },
];

import { useAppStore } from '../../lib/store';
import { toast } from 'sonner';

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    setCurrentSection,
    toggleTheme,
    theme,
    openAssessment,
    toggleExport,
    setCommandPaletteOpen,
  } = useAppStore();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // If user presses any shortcut key while modal is open, close modal
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (e.target as HTMLElement)?.tagName
      );
      if (!inInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (['h', 'd', 'g', 'r', 'p', 'l', 'e', 't', 'k', '?'].includes(key)) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExecuteShortcut = (keys: string[]) => {
    onClose();
    const primary = keys[0]?.toUpperCase();
    if (primary === 'H') setCurrentSection('home');
    else if (primary === 'D') setCurrentSection('dashboard');
    else if (primary === 'G') setCurrentSection('gaps');
    else if (primary === 'R') setCurrentSection('roadmap');
    else if (primary === 'P') setCurrentSection('progress');
    else if (primary === 'L') openAssessment();
    else if (primary === 'E') toggleExport();
    else if (primary === 'T') {
      toggleTheme();
      toast.info(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} theme`);
    } else if (keys.includes('K')) {
      setCommandPaletteOpen(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--bg-elev-1)] shadow-2xl p-6 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-sky)]/10 text-[var(--accent-sky)] flex items-center justify-center border border-[var(--accent-sky)]/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 id="shortcuts-title" className="text-base font-bold font-display text-[var(--text)]">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Power-user navigation and high-velocity workflow hotkeys
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)] flex items-center justify-center cursor-pointer transition-colors border border-transparent hover:border-[var(--border)]"
            aria-label="Close keyboard shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                {group.category}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleExecuteShortcut(item.keys)}
                    className="flex items-center justify-between py-2 px-3 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] text-xs hover:border-[var(--accent-indigo)] hover:bg-[var(--bg-elev-3)] transition-all cursor-pointer group"
                    title="Click or press key to activate and close panel"
                  >
                    <span className="text-[var(--text)] font-sans group-hover:text-[var(--accent-indigo)] transition-colors">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)] font-mono text-[11px] font-bold text-[var(--text)] shadow-xs min-w-[24px] text-center group-hover:border-[var(--accent-indigo)]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Command className="w-3.5 h-3.5 text-[var(--accent-sky)]" />
            <span>Click any shortcut or press key to execute</span>
          </span>
          <span>Press ESC or key to exit</span>
        </div>
      </div>
    </div>
  );
};
