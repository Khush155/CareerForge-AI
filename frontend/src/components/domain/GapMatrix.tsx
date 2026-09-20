import React, { useState } from 'react';
import type { SkillGap } from '../../lib/schemas';
import { GapTrack } from './GapTrack';
import { PriorityBadge } from './PriorityBadge';
import { formatLevel } from '../../lib/format';
import { Search, Sparkles, BookOpen, Clock, Target, CheckCircle } from 'lucide-react';

export interface GapMatrixProps {
  gaps: SkillGap[];
  onSelectSkill: (skill: string) => void;
}

type SortColumn = 'skill' | 'current' | 'required' | 'gap' | 'priority';

const PRIORITY_ORDER: Record<string, number> = {
  High: 4,
  Medium: 3,
  Low: 2,
  Mastered: 1,
};

export const GapMatrix: React.FC<GapMatrixProps> = ({ gaps, onSelectSkill }) => {
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
  const totalNetGap = gaps.reduce((acc, g) => acc + g.gap, 0);
  const totalHours = Math.round(totalNetGap * 15);
  const masteredCount = gaps.filter((g) => g.gap === 0 || g.priority === 'Mastered').length;
  const criticalCount = gaps.filter((g) => g.priority === 'High').length;
  const readinessIndex = gaps.length > 0
    ? Math.round((gaps.reduce((acc, g) => acc + Math.min(1, g.current_level / (g.required_level || 1)), 0) / gaps.length) * 100)
    : 0;

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
    <div className="flex flex-col gap-5">
      {/* Executive Metric Summary Cards */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-1 border border-[var(--border-default)]">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>TOTAL NET GAP</span>
            <Target className="w-3.5 h-3.5 text-[var(--neon-rose)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
            {formatLevel(totalNetGap)} <span className="text-xs font-normal text-[var(--text-muted)]">pts</span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            {criticalCount} critical priority domains
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 flex flex-col gap-1 border border-[var(--border-default)]">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>STUDY INVESTMENT</span>
            <Clock className="w-3.5 h-3.5 text-[var(--neon-indigo)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
            {totalHours} <span className="text-xs font-normal text-[var(--text-muted)]">hours</span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            Across {gaps.length} target skills
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 flex flex-col gap-1 border border-[var(--border-default)]">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>READINESS INDEX</span>
            <Sparkles className="w-3.5 h-3.5 text-[var(--neon-cyan)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--neon-cyan)]">
            {readinessIndex}%
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            Benchmark fulfillment ratio
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 flex flex-col gap-1 border border-[var(--border-default)]">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>DOMAINS MASTERED</span>
            <CheckCircle className="w-3.5 h-3.5 text-[var(--neon-emerald)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--neon-emerald)]">
            {masteredCount} <span className="text-xs font-normal text-[var(--text-muted)]">/ {gaps.length}</span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            Ready for interview evaluation
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex justify-between items-center gap-3 flex-wrap bg-[var(--bg-sunken)] p-3.5 rounded-2xl border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skill (e.g. SQL, Python, Docker)..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: `All (${gaps.length})` },
            { id: 'critical', label: `Critical (${gaps.filter((g) => g.priority === 'High').length})` },
            { id: 'moderate', label: `Moderate (${gaps.filter((g) => g.priority === 'Medium').length})` },
            { id: 'mastered', label: `Mastered (${masteredCount})` },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilterPriority(btn.id)}
              className={`h-7 px-3 rounded-full text-xs font-mono font-medium transition-colors cursor-pointer border ${
                filterPriority === btn.id
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-[var(--border-default)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <caption className="sr-only">
              Skill gaps comparison between student level and verified market requirements
            </caption>
            <thead className="bg-[var(--bg-sunken)] border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] font-mono font-semibold select-none">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 px-4 cursor-pointer hover:text-[var(--neon-cyan)] transition-colors"
                  onClick={() => handleSort('skill')}
                >
                  Skill Domain {sortCol === 'skill' && (sortAsc ? '▲' : '▼')}
                </th>
                <th scope="col" className="py-3.5 px-4 w-44">
                  Proficiency vs Benchmark
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-[var(--neon-cyan)] transition-colors"
                  onClick={() => handleSort('current')}
                >
                  You {sortCol === 'current' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-[var(--neon-cyan)] transition-colors"
                  onClick={() => handleSort('required')}
                >
                  Benchmark {sortCol === 'required' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-[var(--neon-cyan)] transition-colors"
                  onClick={() => handleSort('gap')}
                >
                  Net Gap {sortCol === 'gap' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-4 cursor-pointer hover:text-[var(--neon-cyan)] transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  Priority {sortCol === 'priority' && (sortAsc ? '▲' : '▼')}
                </th>
                <th scope="col" className="py-3.5 px-4 text-right">
                  Study Hours
                </th>
                <th scope="col" className="py-3.5 px-4 text-center">
                  Curated Guide
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {sortedGaps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-[var(--neon-indigo)]" />
                      <span>No matching skills found. Try clearing your search filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedGaps.map((gap) => {
                  const allocatedHours = Math.round(gap.gap * 15);

                  return (
                    <tr
                      key={gap.skill}
                      tabIndex={0}
                      className="hover:bg-[var(--bg-raised)] cursor-pointer transition-all duration-150 group"
                      onClick={() => onSelectSkill(gap.skill)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSelectSkill(gap.skill);
                      }}
                    >
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)] group-hover:text-[var(--neon-cyan)] transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[var(--neon-cyan)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="font-sans">{gap.skill}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <GapTrack
                          current={gap.current_level}
                          required={gap.required_level}
                          size="sm"
                          priority={gap.priority}
                          label={`${gap.skill} level`}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-semibold text-[var(--text-secondary)]">
                        {formatLevel(gap.current_level)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-semibold text-[var(--neon-cyan)]">
                        {formatLevel(gap.required_level)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-bold text-[var(--text-primary)]">
                        {formatLevel(gap.gap)}
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge level={gap.priority} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[var(--text-muted)]">
                        {allocatedHours > 0 ? `${allocatedHours} hrs` : 'Mastered'}
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectSkill(gap.skill)}
                          className="px-2.5 py-1 rounded-xl bg-[var(--bg-sunken)] hover:bg-[var(--accent-quiet)] border border-[var(--border-default)] hover:border-[var(--neon-cyan)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Guide</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
