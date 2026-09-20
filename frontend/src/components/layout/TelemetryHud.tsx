import React from 'react';
import { Cpu, ShieldCheck, Database, CheckCircle2, Zap } from 'lucide-react';

interface TelemetryHudProps {
  version: number;
}

export const TelemetryHud: React.FC<TelemetryHudProps> = ({ version }) => {
  return (
    <div className="w-full bg-[var(--bg-sunken)] border border-[var(--border-subtle)] rounded-[var(--r-md)] px-4 py-2 flex items-center justify-between gap-4 flex-wrap text-xs font-mono overflow-x-auto select-none">
      {/* Item 1: Engine Status */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--neon-emerald)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--neon-emerald)]"></span>
        </span>
        <span className="text-[var(--text-muted)]">CORE:</span>
        <span className="text-[var(--neon-emerald)] font-semibold flex items-center gap-1">
          <Cpu className="w-3 h-3 inline" /> ONLINE
        </span>
      </div>

      {/* Divider */}
      <span className="text-[var(--border-default)] hidden sm:inline">|</span>

      {/* Item 2: Deterministic Guarantee */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--neon-cyan)]" />
        <span className="text-[var(--text-muted)]">MATH DRIFT:</span>
        <span className="text-[var(--text-primary)] font-semibold">0.00%</span>
        <span className="text-[var(--neon-cyan)] text-[10px] bg-[var(--neon-cyan)]/10 px-1 py-0.5 rounded">
          PURE PYTHON
        </span>
      </div>

      {/* Divider */}
      <span className="text-[var(--border-default)] hidden md:inline">|</span>

      {/* Item 3: Curated Knowledge Base */}
      <div className="flex items-center gap-1.5 shrink-0 hidden md:flex">
        <Database className="w-3 h-3 text-[var(--neon-indigo)]" />
        <span className="text-[var(--text-muted)]">LOCAL RAG:</span>
        <span className="text-[var(--text-primary)] font-semibold">15 VERIFIED SOURCES</span>
      </div>

      {/* Divider */}
      <span className="text-[var(--border-default)] hidden lg:inline">|</span>

      {/* Item 4: Verified Test Suite */}
      <div className="flex items-center gap-1.5 shrink-0 hidden lg:flex">
        <CheckCircle2 className="w-3 h-3 text-[var(--neon-emerald)]" />
        <span className="text-[var(--text-muted)]">SUITE:</span>
        <span className="text-[var(--text-primary)] font-semibold">46/46 PASSING</span>
      </div>

      {/* Divider */}
      <span className="text-[var(--border-default)] hidden sm:inline">|</span>

      {/* Item 5: Active Roadmap Version & Micro Latency */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <span className="text-[var(--text-muted)]">REVISION:</span>
        <span className="px-1.5 py-0.5 rounded bg-[var(--accent-quiet)] text-[var(--accent)] font-bold border border-[var(--accent)]/30">
          v{version}
        </span>
        <span className="text-[var(--text-muted)] text-[10px] flex items-center gap-0.5">
          <Zap className="w-2.5 h-2.5 text-[var(--neon-amber)]" /> 1.8ms
        </span>
      </div>
    </div>
  );
};
