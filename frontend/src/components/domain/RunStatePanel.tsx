import React from 'react';

export interface RunStatePanelProps {
  version: number;
  mode?: string;
  spend?: string;
  tests?: string;
}

export const RunStatePanel: React.FC<RunStatePanelProps> = ({
  version,
  mode = 'mock (resilient)',
  spend = '$0.00',
  tests = '46 / 46',
}) => {
  return (
    <div className="bg-[var(--bg-sunken)] border border-[var(--border-subtle)] rounded-2xl p-3.5 flex flex-col gap-2">
      <div className="text-[0.6875rem] font-mono text-[var(--text-muted)] uppercase tracking-wider pb-1 border-b border-[var(--border-subtle)]">
        System Run State
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--text-muted)]">Mode</span>
        <span className="font-mono font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-low)] inline-block" />
          <span>{mode}</span>
        </span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--text-muted)]">Spend</span>
        <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">{spend}</span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--text-muted)]">Tests</span>
        <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">{tests}</span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--text-muted)]">Revision</span>
        <span className="font-mono tabular-nums font-medium text-[var(--accent)] font-semibold">
          v{version}
        </span>
      </div>
    </div>
  );
};
