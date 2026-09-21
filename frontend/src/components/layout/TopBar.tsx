import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { getCartoonAvatarUrl } from '../../lib/avatar';
import {
  Search,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  Layers,
  GraduationCap,
  Command as CommandIcon,
  Download,
  Keyboard,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    profile,
    roadmap,
    openAssessment,
    setCommandPaletteOpen,
    setShortcutsOpen,
    setExportOpen,
    setCurrentSection,
    avatar,
    randomizeAvatar,
    savedProfiles,
    switchProfile,
  } = useAppStore();

  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between transition-colors select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCurrentSection('home')}
          className="flex items-center gap-2.5 cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-indigo)] via-[var(--accent-sky)] to-[var(--accent-mint)] p-0.5 shadow-md group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/logo.png"
              alt="CareerForge AI Logo"
              className="w-full h-full rounded-full object-cover bg-black"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold font-display tracking-tight text-[var(--text)]">
              CareerForge <span className="text-brand-gradient">AI</span>
            </span>
          </div>
        </button>

        {/* Plan Version Badge */}
        {roadmap && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/25">
            <Layers className="w-3 h-3" />
            v{roadmap.version.toFixed(1)}
          </span>
        )}
      </div>

      {/* Global Search Field (Opens Command Palette) */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full h-9 px-3.5 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center justify-between transition-all cursor-pointer shadow-inner"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[var(--text-faint)]" />
            <span className="truncate">Search commands, jobs, skills, guides...</span>
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-elev-1)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-faint)]">
            <CommandIcon className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Actions & Utilities */}
      <div className="flex items-center gap-2">
        {/* Quick Search on Mobile */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)] cursor-pointer"
          aria-label="Open Command Palette"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick "Log Assessment" Button */}
        <button
          type="button"
          onClick={openAssessment}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-[var(--text)] transition-colors cursor-pointer"
          title="Quick log assessment (Shortcut: L)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          <span>Assess</span>
          <kbd className="text-[10px] font-mono text-[var(--text-faint)] px-1 rounded bg-[var(--bg-elev-1)] border border-[var(--border)]">
            L
          </kbd>
        </button>

        {/* Quick Export & Share Button */}
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-[var(--text)] transition-colors cursor-pointer"
          title="Export plan as Markdown, PDF, or JSON (Shortcut: E)"
        >
          <Download className="w-3.5 h-3.5 text-[var(--accent-mint)]" />
          <span>Export</span>
          <kbd className="text-[10px] font-mono text-[var(--text-faint)] px-1 rounded bg-[var(--bg-elev-1)] border border-[var(--border)]">
            E
          </kbd>
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (Shortcut: ?)"
        >
          <Keyboard className="w-4 h-4 text-[var(--text-muted)]" />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
          aria-label="Toggle light and dark theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[var(--accent-amber)]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--accent-indigo)]" />
          )}
        </button>

        {/* Profile Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-[var(--bg-elev-2)] border border-transparent hover:border-[var(--border)] transition-all cursor-pointer group"
            aria-expanded={isProfileMenuOpen}
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] overflow-hidden flex items-center justify-center shadow-xs group-hover:border-[var(--accent-indigo)] transition-colors p-0.5 shrink-0">
              <img
                src={getCartoonAvatarUrl(profile?.avatar || avatar, 'bottts')}
                alt="Cartoon Avatar"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-[var(--text)] leading-tight truncate max-w-[110px]">
                {profile ? profile.name : 'Student Profile'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[110px]">
                {profile ? profile.target_role : 'Click to setup'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>

          {/* Dropdown Menu Box */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elev-1)] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-[var(--border)] mb-1 flex items-center gap-3">
                <div className="relative group shrink-0" title="Shuffle cartoon avatar">
                  <div className="w-11 h-11 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] overflow-hidden p-0.5 shadow-sm">
                    <img
                      src={getCartoonAvatarUrl(profile?.avatar || avatar, 'bottts')}
                      alt="Cartoon Avatar"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      randomizeAvatar();
                    }}
                    title="Shuffle cartoon avatar"
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-indigo)] text-white flex items-center justify-center text-[10px] shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer border border-[var(--border)]"
                  >
                    🎲
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text)] truncate">
                    {profile ? profile.name : 'Guest Student'}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    {profile ? `${profile.target_role} · Yr ${profile.year}` : 'No active profile'}
                  </p>
                </div>
              </div>

              {savedProfiles.filter((p) => p.name !== profile?.name || p.target_role !== profile?.target_role).length > 0 && (
                <div className="py-1 border-b border-[var(--border)] mb-1">
                  <div className="px-3 py-1 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    Saved Profiles
                  </div>
                  {savedProfiles
                    .filter((p) => p.name !== profile?.name || p.target_role !== profile?.target_role)
                    .slice(0, 3)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          switchProfile(p.id);
                          setProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs hover:bg-[var(--bg-elev-2)] text-left cursor-pointer transition-colors"
                      >
                        <div className="w-5 h-5 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border)] overflow-hidden shrink-0">
                          <img
                            src={getCartoonAvatarUrl(p.avatar || 'bottts', 'bottts')}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--text)] truncate">{p.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">{p.target_role}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setCurrentSection('settings');
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-elev-2)] transition-colors text-left cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-[var(--accent-indigo)]" />
                <span>Manage Profile & Targets</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
