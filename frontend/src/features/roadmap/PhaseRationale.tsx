import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, GitBranch, ShieldCheck } from 'lucide-react';

interface PhaseRationaleProps {
  targetRole: string;
}

const RATIONALE_STAGES = [
  {
    step: '1. Foundations & Language Core',
    desc: 'Syntax, memory models, and core algorithmic data structures must precede framework abstractions to avoid brittle copy-paste patterns.',
    tag: 'Prerequisite Node 0',
  },
  {
    step: '2. Application Architecture & APIs',
    desc: 'Building clean REST/GraphQL services, controllers, validation schemas, and database entity relationships on a solid core.',
    tag: 'Prerequisite Node 1',
  },
  {
    step: '3. Data Persistence & Distributed Systems',
    desc: 'Relational query optimization, indexing, Redis caching layers, and asynchronous background worker queues.',
    tag: 'Prerequisite Node 2',
  },
  {
    step: '4. Infrastructure, Testing & Placement',
    desc: 'Containerization (Docker), CI/CD automated test pipelines, and high-yield placement mock interviews.',
    tag: 'Final Terminal Node',
  },
];

export const PhaseRationale: React.FC<PhaseRationaleProps> = ({ targetRole }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev-1)] overflow-hidden transition-all shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-elev-2)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-sky)]/10 text-[var(--accent-sky)] flex items-center justify-center">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-display text-[var(--text)] flex items-center gap-2">
              <span>Why this execution sequence?</span>
              <span className="font-mono text-[10px] text-[var(--accent-indigo)] font-semibold uppercase bg-[var(--accent-indigo)]/10 px-2 py-0.5 rounded-full">
                Prerequisite DAG
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Strict topological dependency ordering tailored for {targetRole}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
          <span>{isExpanded ? 'Hide Architecture' : 'View Architecture'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-[var(--border-subtle)] p-5 bg-[var(--bg-elev-2)]/50 space-y-4 text-xs"
          >
            <div className="flex items-start gap-2 text-[var(--text-muted)] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-mint)] shrink-0 mt-0.5" />
              <span>
                Phases are mathematically sequenced using an acyclic dependency graph. Each phase builds direct prerequisite mastery for the subsequent stage, minimizing cognitive thrash and eliminating premature optimization.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {RATIONALE_STAGES.map((s) => (
                <div
                  key={s.step}
                  className="p-3.5 rounded-xl bg-[var(--bg-elev-1)] border border-[var(--border)] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-display text-[var(--text)]">
                      {s.step}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-faint)]">
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
