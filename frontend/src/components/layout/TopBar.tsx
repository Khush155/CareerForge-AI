import React, { useState } from 'react';
import type { StudentProfile } from '../../lib/schemas';
import { useAppStore } from '../../lib/store';
import { Copy, Sun, Moon, HelpCircle, Eye, EyeOff, Cpu } from 'lucide-react';

export interface TopBarProps {
  profile: StudentProfile | null;
  version: number;
  onCopySummary?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  profile,
  version,
  onCopySummary,
}) => {
  const { theme, toggleTheme, showParticles, toggleParticles } = useAppStore();
  const [showHelp, setShowHelp] = useState(false);

  const identityText = profile ? (
    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
      <span className="font-bold text-[var(--text-primary)] font-sans">{profile.name || 'Student'}</span>
      <span className="text-[var(--border-strong)]">·</span>
      <span className="hidden lg:inline">{profile.degree} {profile.branch}, Yr {profile.year}</span>
      <span className="text-[var(--border-strong)] hidden lg:inline">·</span>
      <span className="text-[var(--neon-cyan)] font-semibold">{profile.target_role}</span>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
      <span className="font-bold text-[var(--text-primary)] font-sans">Aarav Sharma</span>
      <span className="text-[var(--border-strong)]">·</span>
      <span className="hidden lg:inline">B.Tech CS, Yr 3</span>
      <span className="text-[var(--border-strong)] hidden lg:inline">·</span>
      <span className="text-[var(--neon-cyan)] font-semibold">Backend Engineer</span>
    </div>
  );

  return (
    <header className="bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--border-subtle)] sticky top-0 z-30 flex flex-col select-none">
      {/* Top Bar Header */}
      <div className="h-16 flex items-center justify-between px-6 max-md:px-4">
        {/* Left: Prominent CareerForge AI Brand + Identity */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--neon-cyan)] via-[var(--neon-indigo)] to-[var(--neon-violet)] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,242,254,0.35)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="brand-title text-base sm:text-lg tracking-tight leading-tight font-sans">
                CareerForge <span className="brand-accent font-black">AI</span>
              </span>
              <span className="text-[10px] font-mono text-app-muted tracking-wider uppercase leading-none mt-0.5">
                Placement System
              </span>
            </div>
          </div>

          <span className="text-[var(--border-default)] hidden sm:inline">|</span>

          {/* Student Context Profile */}
          <div className="truncate hidden sm:flex items-center">
            {identityText}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-mono text-xs font-bold bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] px-2.5 py-1 rounded-full border border-[var(--neon-cyan)]/30 tabular-nums shadow-sm">
            Revision v{version}.0
          </span>

          {/* Copy Summary Action */}
          {onCopySummary && (
            <button
              type="button"
              onClick={onCopySummary}
              className="h-8 px-3.5 border border-[var(--border-default)] rounded-xl text-xs font-mono font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1.5"
              title="Copy markdown run report"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Copy Run</span>
            </button>
          )}

          {/* Ambient Particles Toggle */}
          <button
            type="button"
            onClick={toggleParticles}
            aria-label={showParticles ? 'Turn off background particles' : 'Turn on background particles'}
            title={showParticles ? 'Background Particles: ON' : 'Background Particles: OFF'}
            className="w-8 h-8 border border-[var(--border-default)] rounded-xl flex items-center justify-center text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {showParticles ? <Eye className="w-3.5 h-3.5 text-[var(--neon-cyan)]" /> : <EyeOff className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            title={`Current theme: ${theme}. Click to switch.`}
            className="w-8 h-8 border border-[var(--border-default)] rounded-xl flex items-center justify-center text-sm text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-[var(--neon-violet)]" />
            ) : (
              <Sun className="w-4 h-4 text-[var(--neon-amber)]" />
            )}
          </button>

          {/* Shortcuts Help */}
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            aria-label="Show keyboard shortcuts"
            className="w-8 h-8 border border-[var(--border-default)] rounded-xl flex items-center justify-center text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Popover */}
      {showHelp && (
        <div className="absolute right-6 top-16 z-50 glass-panel rounded-2xl p-4 shadow-xl border border-[var(--border-default)] text-xs font-mono w-72 flex flex-col gap-2">
          <div className="flex justify-between items-center pb-1 border-b border-[var(--border-subtle)] font-bold text-[var(--text-primary)]">
            <span>Keyboard Shortcuts</span>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Log Score Modal:</span>
            <span className="px-1.5 py-0.2 rounded bg-[var(--bg-sunken)] text-[var(--neon-cyan)]">L</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Toggle Theme:</span>
            <span className="px-1.5 py-0.2 rounded bg-[var(--bg-sunken)] text-[var(--neon-cyan)]">T</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Open Evidence:</span>
            <span className="px-1.5 py-0.2 rounded bg-[var(--bg-sunken)] text-[var(--neon-cyan)]">E</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Presenter Mode:</span>
            <span className="px-1.5 py-0.2 rounded bg-[var(--bg-sunken)] text-[var(--neon-cyan)]">Shift + P</span>
          </div>
        </div>
      )}
    </header>
  );
};
