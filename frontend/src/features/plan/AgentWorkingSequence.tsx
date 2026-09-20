import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Compass, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface AgentWorkingSequenceProps {
  targetRole: string;
}

const AGENT_STEPS = [
  { id: 1, label: 'Understanding your career goal & target industry profile', duration: 400 },
  { id: 2, label: 'Reading verified market benchmarks & citations', duration: 700 },
  { id: 3, label: 'Calculating mathematical skill gaps [Gap = Req − Cur]', duration: 1000 },
  { id: 4, label: 'Retrieving local curated preparation guides & resources', duration: 1300 },
  { id: 5, label: 'Synthesizing phased sequential execution timeline', duration: 1600 },
];

export const AgentWorkingSequence: React.FC<AgentWorkingSequenceProps> = ({ targetRole }) => {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timers = AGENT_STEPS.map((step) =>
      setTimeout(() => {
        setActiveStep(step.id);
      }, step.duration)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/90 backdrop-blur-md p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border-strong)] shadow-2xl space-y-6 text-center"
      >
        {/* Animated Brand Pulse Core */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--accent-indigo)] via-[var(--accent-violet)] to-[var(--accent-pink)] animate-pulse blur-md opacity-60" />
          <div className="relative w-14 h-14 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] flex items-center justify-center shadow-lg">
            <Compass className="w-7 h-7 text-[var(--accent-sky)] animate-spin-slow" />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] text-xs font-mono font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span>Agent Orchestrator Active</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-[var(--text)]">
            Building Your Roadmap
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Tailoring deterministic curriculum for <strong className="text-[var(--text)]">{targetRole}</strong>
          </p>
        </div>

        {/* Sequential Steps Checklist */}
        <div className="space-y-3 text-left pt-2">
          {AGENT_STEPS.map((step) => {
            const isCompleted = activeStep > step.id;
            const isCurrent = activeStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-[var(--accent-indigo)]/10 border-[var(--accent-indigo)]/30 text-[var(--text)]'
                    : isCompleted
                    ? 'bg-[var(--bg-elev-2)] border-[var(--border)] text-[var(--text-muted)]'
                    : 'bg-transparent border-transparent text-[var(--text-faint)]'
                }`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-mint)]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-[var(--accent-sky)] animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[var(--border)]" />
                  )}
                </div>
                <span className="text-xs font-medium truncate">{step.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
