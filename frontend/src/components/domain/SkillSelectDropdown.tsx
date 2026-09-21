import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Search,
  Check,
  Target,
  Sparkles,
  BookOpen,
  UserCheck,
  X,
} from 'lucide-react';
import { formatLevel } from '../../lib/format';

export interface SelectableSkillItem {
  name: string;
  proficiency: number;
  source: string;
  category: 'gap' | 'market' | 'phase' | 'profile';
  priority?: string;
  gap?: number;
  required_level?: number;
}

interface SkillSelectDropdownProps {
  skills: SelectableSkillItem[];
  selectedSkill: string;
  onSelect: (skillName: string) => void;
  id?: string;
}

export const SkillSelectDropdown: React.FC<SkillSelectDropdownProps> = ({
  skills,
  selectedSkill,
  onSelect,
  id = 'skill-select-dropdown',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeItem = useMemo(() => {
    return skills.find((s) => s.name.toLowerCase().trim() === selectedSkill.toLowerCase().trim()) || skills[0];
  }, [skills, selectedSkill]);

  // Check viewport bounds to prevent dropdown cutoff by opening upwards if needed
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 320px below and enough room above, flip upwards
      if (spaceBelow < 320 && rect.top > 320) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input on open
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return skills;
    const q = searchQuery.toLowerCase().trim();
    return skills.filter((item) =>
      item.name.toLowerCase().includes(q) || item.source.toLowerCase().includes(q)
    );
  }, [skills, searchQuery]);

  const getCategoryBadge = (cat: SelectableSkillItem['category'], priority?: string) => {
    switch (cat) {
      case 'gap':
        return {
          icon: <Target className="w-3 h-3 text-emerald-400" />,
          label: priority ? `Target Gap (${priority})` : 'Target Gap',
          className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
      case 'market':
        return {
          icon: <Sparkles className="w-3 h-3 text-cyan-400" />,
          label: 'Market Need',
          className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        };
      case 'phase':
        return {
          icon: <BookOpen className="w-3 h-3 text-[var(--accent-sky)]" />,
          label: 'Roadmap Milestone',
          className: 'bg-sky-500/15 text-[var(--accent-sky)] border-sky-500/30',
        };
      case 'profile':
      default:
        return {
          icon: <UserCheck className="w-3 h-3 text-violet-400" />,
          label: 'Profile Calibrated',
          className: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
        };
    }
  };

  const activeBadge = activeItem ? getCategoryBadge(activeItem.category, activeItem.priority) : null;

  return (
    <div ref={containerRef} className="relative w-full" id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[58px] p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer select-none ${
          isOpen
            ? 'bg-[var(--bg-elev-3)] border-[var(--accent-sky)] shadow-[0_0_20px_rgba(56,189,248,0.18)]'
            : 'bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border-[var(--border)] hover:border-[var(--border-strong)]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-elev-1)] border border-[var(--border)] flex items-center justify-center shrink-0">
            {activeBadge?.icon || <Target className="w-4 h-4 text-[var(--accent-mint)]" />}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[var(--text)] font-sans truncate">
                {activeItem?.name || 'Select a skill to assess'}
              </span>
              {activeBadge && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${activeBadge.className}`}
                >
                  {activeBadge.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)] mt-0.5">
              <span>Current: <strong className="text-[var(--text)]">{formatLevel(activeItem?.proficiency ?? 0)}</strong> / 5.0</span>
              {activeItem?.gap !== undefined && activeItem.gap > 0 && (
                <span className="text-amber-400 font-semibold">
                  • Gap: {activeItem.gap.toFixed(1)} pts
                </span>
              )}
              {activeItem?.required_level !== undefined && (
                <span className="hidden sm:inline text-[var(--text-muted)]">
                  • Benchmark: {activeItem.required_level.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Level Indicator Pill & Chevron */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <div className="w-20 h-1.5 bg-[var(--bg-elev-1)] rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-sky)] to-[var(--accent-mint)] transition-all duration-300"
                style={{ width: `${Math.min(100, ((activeItem?.proficiency ?? 0) / 5) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
              {Math.round(((activeItem?.proficiency ?? 0) / 5) * 100)}% Mastered
            </span>
          </div>

          <div
            className={`w-7 h-7 rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--accent-sky)] border-[var(--accent-sky)]/40' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Floating Glassmorphic Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-[100] left-0 right-0 ${
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
          } bg-[var(--bg-elev-1)]/95 backdrop-blur-xl border border-[var(--border-strong)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[340px] animate-in fade-in ${
            openUpwards ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'
          } duration-150`}
        >
          {/* Top Search Bar */}
          <div className="p-2.5 border-b border-[var(--border)] bg-[var(--bg-elev-2)]">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${skills.length} competencies discovered by AI...`}
                className="w-full h-9 pl-9 pr-8 bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--accent-sky)] outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 rounded-md hover:bg-[var(--bg-elev-2)] text-[var(--text-muted)] hover:text-[var(--text)] absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Skill List with fixed comfortable viewport */}
          <div className="overflow-y-auto divide-y divide-[var(--border)] p-1.5 max-h-[260px]">
            {filteredSkills.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-[var(--text-muted)]">
                No matching skills found for "{searchQuery}".
              </div>
            ) : (
              filteredSkills.map((item) => {
                const isSelected = item.name.toLowerCase().trim() === selectedSkill.toLowerCase().trim();
                const badge = getCategoryBadge(item.category, item.priority);

                return (
                  <button
                    key={item.name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(item.name);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-[var(--accent-mint)]/10 text-[var(--text)]'
                        : 'hover:bg-[var(--bg-elev-2)] text-[var(--text)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[var(--accent-mint)]/20 border-[var(--accent-mint)]/40 text-[var(--accent-mint)]'
                            : 'bg-[var(--bg-elev-2)] border-[var(--border)] text-[var(--text-muted)] group-hover:text-[var(--text)]'
                        }`}
                      >
                        {badge.icon}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold font-sans truncate ${
                              isSelected ? 'text-[var(--accent-mint)]' : 'text-[var(--text)]'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                          <span>Level: {formatLevel(item.proficiency)} / 5.0</span>
                          {item.gap !== undefined && item.gap > 0 && (
                            <span className="text-amber-400">
                              • Gap: {item.gap.toFixed(1)} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-mint)] text-black flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] group-hover:text-[var(--accent-sky)] opacity-0 group-hover:opacity-100 transition-opacity">
                          Select →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
