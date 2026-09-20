import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { AssessmentResult } from '../../lib/schemas';
import { formatLevel } from '../../lib/format';
import {
  History,
  TrendingUp,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface AssessmentHistoryProps {
  profileId: string | null;
  refreshTrigger?: number;
}

export const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({
  profileId,
  refreshTrigger = 0,
}) => {
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profileId || profileId.startsWith('demo-')) {
      // Demo history records for preview
      setHistory([
        {
          profile_id: profileId || 'demo',
          skill: 'Python',
          score_percentage: 85,
          previous_level: 2.5,
          updated_level: 3.6,
          level_delta: 1.1,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          profile_id: profileId || 'demo',
          skill: 'SQL',
          score_percentage: 92,
          previous_level: 1.5,
          updated_level: 3.4,
          level_delta: 1.9,
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
      return;
    }

    setIsLoading(true);
    fetch(`/api/assessment/${encodeURIComponent(profileId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHistory(data))
      .catch((err) => console.warn('Failed to load assessment history:', err))
      .finally(() => setIsLoading(false));
  }, [profileId, refreshTrigger]);

  if (!profileId) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] text-center text-xs font-mono text-[var(--text-muted)]">
        Load or create a student profile to view chronological assessment history.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-display text-[var(--text)]">
              Assessment Audit Trail
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Chronological log of diagnostic evaluations and deterministic level jumps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-mint)]" />}
          <span className="font-mono text-xs text-[var(--text-muted)] bg-[var(--bg-elev-2)] px-2.5 py-1 rounded-full border border-[var(--border)]">
            {history.length} Event{history.length !== 1 ? 's' : ''} Logged
          </span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[var(--bg-elev-1)] border border-dashed border-[var(--border-strong)] text-center text-xs font-mono text-[var(--text-muted)]">
          No evaluations logged yet. Run an assessment above to record your first diagnostic result.
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev-1)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--bg-elev-2)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th scope="col" className="py-3 px-4">Evaluation Date</th>
                  <th scope="col" className="py-3 px-4">Evaluated Skill</th>
                  <th scope="col" className="py-3 px-4 text-center">Score %</th>
                  <th scope="col" className="py-3 px-4 text-center">Level Shift</th>
                  <th scope="col" className="py-3 px-4 text-right">Mastery Jump</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {history.map((record, idx) => {
                  const dateStr = record.timestamp
                    ? new Date(record.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent Sprint';

                  return (
                    <motion.tr
                      key={`${record.skill}-${record.timestamp || idx}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className="hover:bg-[var(--bg-elev-2)] transition-colors"
                    >
                      <td className="py-3 px-4 text-[var(--text-muted)] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                        <span>{dateStr}</span>
                      </td>

                      <td className="py-3 px-4 font-sans font-bold text-sm text-[var(--text)]">
                        {record.skill}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] font-bold">
                          {record.score_percentage}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-[var(--text-muted)]">
                        <span>{formatLevel(record.previous_level)}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1.5 text-[var(--accent-sky)]" />
                        <span className="font-bold text-[var(--text)]">
                          {formatLevel(record.updated_level)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-mastered)]/15 border border-[var(--color-mastered)]/30 text-[var(--color-mastered)] font-bold">
                          <TrendingUp className="w-3 h-3" />
                          +{formatLevel(record.level_delta)} pts
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
