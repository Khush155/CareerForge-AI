import React from 'react';
import { RunStatePanel } from '../domain/RunStatePanel';
import { User, Activity, Layers, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export interface SideRailProps {
  version: number;
  onOpenAssessment: () => void;
}

export const SideRail: React.FC<SideRailProps> = ({
  version,
  onOpenAssessment,
}) => {
  return (
    <aside
      className="w-64 bg-[var(--glass-bg)] backdrop-blur-2xl border-r border-[var(--border-subtle)] flex flex-col fixed top-0 bottom-0 left-0 z-40 p-4 overflow-y-auto max-lg:w-16 max-lg:p-2 max-md:w-full max-md:h-16 max-md:top-auto max-md:bottom-0 max-md:flex-row max-md:border-r-0 max-md:border-t select-none"
      aria-label="System navigation and status"
    >
      {/* Brand Holographic Header */}
      <div className="pb-4 border-b border-[var(--border-subtle)] mb-5 max-lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,242,254,0.4)]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="brand-title text-base tracking-tight leading-tight">
              CareerForge <span className="brand-accent font-black">AI</span>
            </div>
            <div className="text-[10px] font-mono text-app-muted tracking-wider uppercase mt-0.5">
              Placement System
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 mb-5 max-md:flex-row max-md:mb-0 max-md:w-full max-md:justify-around">
        <a
          href="#profile-section"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--neon-cyan)] transition-all max-lg:justify-center group"
        >
          <User className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--neon-cyan)] transition-colors" />
          <span className="max-lg:hidden">Student Profile</span>
        </a>
        <a
          href="#gap-matrix-section"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--neon-cyan)] transition-all max-lg:justify-center group"
        >
          <Activity className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--neon-cyan)] transition-colors" />
          <span className="max-lg:hidden">Skill Gap Matrix</span>
        </a>
        <a
          href="#roadmap-section"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--neon-cyan)] transition-all max-lg:justify-center group"
        >
          <Layers className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--neon-cyan)] transition-colors" />
          <span className="max-lg:hidden">Phased Roadmap</span>
        </a>
      </nav>

      {/* Action: Log Assessment Diagnostic */}
      <div className="mb-5 max-md:hidden">
        <button
          type="button"
          onClick={onOpenAssessment}
          className="w-full h-11 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-indigo)] to-[var(--neon-violet)] hover:opacity-95 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all cursor-pointer group"
        >
          <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="max-lg:hidden">Log Quiz Score (L)</span>
        </button>
      </div>

      {/* Run State Panel */}
      <div className="mt-auto mb-4 max-md:hidden max-lg:hidden">
        <RunStatePanel version={version} />
      </div>

      {/* 7-Step Loop Disclosure */}
      <details className="text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3 max-md:hidden max-lg:hidden">
        <summary className="cursor-pointer font-mono font-semibold text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] select-none flex items-center justify-between">
          <span>7-Step AI Feedback Loop</span>
          <Sparkles className="w-3 h-3 text-[var(--neon-cyan)]" />
        </summary>
        <div className="pt-2 text-[11px] font-mono text-[var(--text-secondary)] leading-snug flex flex-col gap-1">
          <span className="text-[var(--neon-cyan)]">1. Research Industry Benchmarks</span>
          <span>2. Analyze Student Proficiencies</span>
          <span>3. Compare Deterministic Math</span>
          <span>4. Recommend Local KB Articles</span>
          <span>5. Budget Weekly Bandwidth</span>
          <span className="text-[var(--neon-emerald)]">6. Assess Quiz Performance</span>
          <span className="text-[var(--neon-violet)]">7. Adapt Phased Trajectory</span>
        </div>
      </details>
    </aside>
  );
};
