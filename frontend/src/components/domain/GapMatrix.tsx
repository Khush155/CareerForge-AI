import React, { useState } from 'react';
import type { SkillGap } from '../../lib/schemas';
import { GapTrack } from './GapTrack';
import { PriorityBadge } from './PriorityBadge';
import { formatLevel } from '../../lib/format';
import { SkillRadarChart } from './SkillRadarChart';
import { SkillHeatmap } from './SkillHeatmap';
import {
  Search,
  Sparkles,
  BookOpen,
  Table,
  Grid3X3,
  Radar,
  ShieldCheck,
  ArrowUpDown,
} from 'lucide-react';

export interface GapMatrixProps {
  gaps: SkillGap[];
  onSelectSkill: (skill: string) => void;
  onOpenAssessment?: (skill?: string) => void;
  initialView?: 'table' | 'radar' | 'heatmap';
}

type SortColumn = 'skill' | 'current' | 'required' | 'gap' | 'priority';
type ViewMode = 'table' | 'radar' | 'heatmap';

const PRIORITY_ORDER: Record<string, number> = {
  High: 4,
  Medium: 3,
  Low: 2,
  Mastered: 1,
};

export const GapMatrix: React.FC<GapMatrixProps> = ({
  gaps,
  onSelectSkill,
  onOpenAssessment,
  initialView = 'table',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [sortCol, setSortCol] = useState<SortColumn>('priority');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  // Metrics computation
  const masteredCount = gaps.filter((g) => g.gap === 0 || g.priority === 'Mastered').length;
  const criticalCount = gaps.filter((g) => g.priority === 'High').length;
  const moderateCount = gaps.filter((g) => g.priority === 'Medium').length;

  // Filter & Search
  const filteredGaps = gaps.filter((g) => {
    const matchesSearch = g.skill.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority =
      filterPriority === 'all' ||
      (filterPriority === 'critical' && g.priority === 'High') ||
      (filterPriority === 'moderate' && g.priority === 'Medium') ||
      (filterPriority === 'minor' && g.priority === 'Low') ||
      (filterPriority === 'mastered' && (g.priority === 'Mastered' || g.gap === 0));
    return matchesSearch && matchesPriority;
  });

  const sortedGaps = [...filteredGaps].sort((a, b) => {
    if (sortCol === 'priority') {
      const wa = PRIORITY_ORDER[a.priority] || 0;
      const wb = PRIORITY_ORDER[b.priority] || 0;
      return sortAsc ? wa - wb : wb - wa;
    }
    if (sortCol === 'gap') {
      return sortAsc ? a.gap - b.gap : b.gap - a.gap;
    }
    if (sortCol === 'current') {
      return sortAsc ? a.current_level - b.current_level : b.current_level - a.current_level;
    }
    if (sortCol === 'required') {
      return sortAsc ? a.required_level - b.required_level : b.required_level - a.required_level;
    }
    if (sortCol === 'skill') {
      return sortAsc ? a.skill.localeCompare(b.skill) : b.skill.localeCompare(a.skill);
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Deterministic Mathematical Formula Callout Banner */}
      <div className="p-4 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-mono font-bold text-[var(--accent-mint)] uppercase tracking-wider">
              Deterministic Math Standard
            </span>
            <div className="text-[var(--text-muted)] mt-0.5">
              Calculated using{' '}
              <code className="px-1.5 py-0.5 rounded bg-[var(--bg-elev-2)] text-[var(--text)] font-mono text-[11px] font-semibold border border-[var(--border)]">
                Gap = max(0, Required − Current)
              </code>
              . Zero subjective model hallucinations.
            </div>
          </div>
        </div>

        {/* View Switch Pills */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--bg-elev-2)] border border-[var(--border)] shrink-0 select-none">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'heatmap'
                ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('radar')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'radar'
                ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Radar</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)]">
        {/* Search input */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-[var(--bg-elev-2)] px-3.5 py-2 rounded-xl border border-[var(--border)] focus-within:border-[var(--accent-indigo)] transition-all">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skill (e.g. Python, Docker, DSA)..."
            className="w-full bg-transparent text-xs text-[var(--text)] placeholder-[var(--text-faint)] outline-none font-body"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `All (${gaps.length})` },
            { id: 'critical', label: `Critical (${criticalCount})` },
            { id: 'moderate', label: `Moderate (${moderateCount})` },
            { id: 'mastered', label: `Mastered (${masteredCount})` },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilterPriority(btn.id)}
              className={`h-7 px-3 rounded-full text-xs font-mono font-medium transition-colors cursor-pointer border shrink-0 ${
                filterPriority === btn.id
                  ? 'bg-[var(--accent-indigo)] text-white border-[var(--accent-indigo)]'
                  : 'bg-[var(--bg-elev-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-3)]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW: Heatmap */}
      {viewMode === 'heatmap' && (
        <SkillHeatmap gaps={filteredGaps} onSelectSkill={onSelectSkill} />
      )}

      {/* VIEW: Radar */}
      {viewMode === 'radar' && (
        <SkillRadarChart gaps={filteredGaps} height={380} />
      )}

      {/* VIEW: High-Precision Table */}
      {viewMode === 'table' && (
        <div className="rounded-3xl overflow-hidden shadow-sm border border-[var(--border)] bg-[var(--bg-elev-1)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[var(--bg-elev-2)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] font-mono font-semibold select-none">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 px-4 cursor-pointer hover:text-[var(--text)] transition-colors"
                    onClick={() => handleSort('skill')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Skill Domain</span>
                      <ArrowUpDown className="w-3 h-3 text-[var(--text-faint)]" />
                    </div>
                  </th>
                  <th scope="col" className="py-3.5 px-4 w-48">
                    Proficiency vs Benchmark
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-[var(--text)] transition-colors"
                    onClick={() => handleSort('current')}
                  >
                    You {sortCol === 'current' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-[var(--text)] transition-colors"
                    onClick={() => handleSort('required')}
                  >
                    Target {sortCol === 'required' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-[var(--text)] transition-colors"
                    onClick={() => handleSort('gap')}
                  >
                    Net Gap {sortCol === 'gap' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-4 cursor-pointer hover:text-[var(--text)] transition-colors"
                    onClick={() => handleSort('priority')}
                  >
                    Priority {sortCol === 'priority' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Study Hours
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {sortedGaps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-[var(--accent-indigo)]" />
                        <span>No matching skills found. Try adjusting your search query.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedGaps.map((gap) => {
                    const allocatedHours = Math.round(gap.gap * 15);

                    return (
                      <tr
                        key={gap.skill}
                        className="hover:bg-[var(--bg-elev-2)] transition-colors group"
                      >
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="font-semibold font-display text-[var(--text)] group-hover:text-[var(--accent-indigo)] transition-colors truncate" title={gap.skill}>
                            {gap.skill}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--text-faint)] truncate">
                            {gap.demand_level} demand
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <GapTrack
                            current={gap.current_level}
                            required={gap.required_level}
                            priority={gap.priority}
                            size="sm"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-[var(--text)]">
                          {formatLevel(gap.current_level)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-[var(--text-muted)]">
                          {formatLevel(gap.required_level)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-bold">
                          {gap.gap === 0 ? (
                            <span className="text-[var(--color-mastered)]">0.0</span>
                          ) : (
                            <span className="text-[var(--accent-coral)]">
                              -{formatLevel(gap.gap)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <PriorityBadge level={gap.priority} />
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-[var(--text-muted)]">
                          {gap.gap === 0 ? (
                            <span className="text-[var(--color-mastered)] font-semibold">Ready</span>
                          ) : (
                            `≈ ${allocatedHours}h`
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectSkill(gap.skill)}
                              title="Inspect curated study guide and market citations"
                              className="px-2.5 py-1 rounded-lg bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text)] transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3 text-[var(--accent-sky)]" />
                              <span>Guide</span>
                            </button>
                            {onOpenAssessment && (
                              <button
                                type="button"
                                onClick={() => onOpenAssessment(gap.skill)}
                                title="Log assessment score for this skill"
                                className="p-1 rounded-lg bg-[var(--bg-elev-2)] hover:bg-[var(--accent-indigo)] hover:text-white border border-[var(--border)] text-[var(--text-muted)] transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-[var(--accent-amber)]" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
