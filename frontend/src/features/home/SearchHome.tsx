import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Compass,
  Cpu,
  Server,
  Code2,
  Shield,
  Smartphone,
  Gamepad2,
  Database,
  Layers,
  Clock,
  Loader2,
  CheckCircle2,
  HeartPulse,
  Wrench,
  Scale,
  Plane,
  Palette,
  Briefcase,
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { fetchRoleSuggestions, fetchRolesGrouped, type RoleSuggestion, type RoleGroupedItem } from '../../lib/api';

interface SearchHomeProps {
  onSelectRole: (roleQuery: string) => void;
  isResolving?: boolean;
}

const EXAMPLE_QUERIES = [
  'ML Engineer',
  'Game Developer',
  'SDE at product company',
  'Cybersecurity Analyst',
  'Full Stack Developer',
];

export const SearchHome: React.FC<SearchHomeProps> = ({ onSelectRole, isResolving = false }) => {
  const { profile, roadmap, setCurrentSection } = useAppStore();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<RoleSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [groupedRoles, setGroupedRoles] = useState<Record<string, RoleGroupedItem[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load grouped roles on mount
  useEffect(() => {
    fetchRolesGrouped()
      .then((data) => setGroupedRoles(data))
      .catch((err) => console.error('Failed to load grouped roles:', err));
  }, []);

  // Compute effective suggestions: ALWAYS includes the searched job even if not in DB or network is loading
  const effectiveSuggestions: RoleSuggestion[] = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return suggestions;

    const hasMatch = suggestions.some(
      (s) => s.title.toLowerCase() === trimmed.toLowerCase()
    );
    if (hasMatch || suggestions.length > 0) {
      return suggestions;
    }

    const title = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return [
      {
        id: `custom_${trimmed.toLowerCase().replace(/\s+/g, '_')}`,
        title,
        category: 'Adaptive Career Track',
        tagline: `Explore customized market requirements & skill roadmap for ${title}`,
        demand_level: 'AI Adaptive',
      },
    ];
  }, [query, suggestions]);

  // Debounced autocomplete suggestions (120ms) with race-condition cancellation
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    setShowDropdown(true);
    let isCurrent = true;
    const timer = setTimeout(() => {
      setIsLoadingSuggestions(true);
      fetchRoleSuggestions(trimmed)
        .then((res) => {
          if (isCurrent) {
            setSuggestions(res);
          }
        })
        .catch(() => {
          if (isCurrent) setSuggestions([]);
        })
        .finally(() => {
          if (isCurrent) setIsLoadingSuggestions(false);
        });
    }, 120);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || effectiveSuggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        onSelectRole(query.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < effectiveSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : effectiveSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && effectiveSuggestions[selectedIndex]) {
        onSelectRole(effectiveSuggestions[selectedIndex].title);
      } else if (query.trim()) {
        onSelectRole(query.trim());
      }
      setShowDropdown(false);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const getRoleIcon = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('health') || c.includes('medicine') || c.includes('cardio') || c.includes('clinic'))
      return <HeartPulse className="w-4 h-4 text-[var(--accent-coral)]" />;
    if (c.includes('finance') || c.includes('bank') || c.includes('invest') || c.includes('account'))
      return <TrendingUp className="w-4 h-4 text-[var(--accent-emerald)]" />;
    if (c.includes('core') || c.includes('civil') || c.includes('mech') || c.includes('engineer'))
      return <Wrench className="w-4 h-4 text-[var(--accent-amber)]" />;
    if (c.includes('law') || c.includes('legal') || c.includes('counsel'))
      return <Scale className="w-4 h-4 text-[var(--accent-violet)]" />;
    if (c.includes('aviation') || c.includes('flight') || c.includes('pilot') || c.includes('aerospace'))
      return <Plane className="w-4 h-4 text-[var(--accent-sky)]" />;
    if (c.includes('design') || c.includes('creative') || c.includes('art'))
      return <Palette className="w-4 h-4 text-[var(--accent-pink)]" />;
    if (c.includes('backend')) return <Server className="w-4 h-4 text-[var(--accent-indigo)]" />;
    if (c.includes('frontend')) return <Code2 className="w-4 h-4 text-[var(--accent-pink)]" />;
    if (c.includes('data') || c.includes('ai') || c.includes('ml')) return <Database className="w-4 h-4 text-[var(--accent-sky)]" />;
    if (c.includes('cloud') || c.includes('devops')) return <Layers className="w-4 h-4 text-[var(--accent-amber)]" />;
    if (c.includes('security')) return <Shield className="w-4 h-4 text-[var(--accent-coral)]" />;
    if (c.includes('mobile')) return <Smartphone className="w-4 h-4 text-[var(--accent-violet)]" />;
    if (c.includes('game')) return <Gamepad2 className="w-4 h-4 text-[var(--accent-pink)]" />;
    if (c.includes('business') || c.includes('management')) return <Briefcase className="w-4 h-4 text-[var(--accent-indigo)]" />;
    return <Cpu className="w-4 h-4 text-[var(--accent-indigo)]" />;
  };

  const categories = ['All', ...Object.keys(groupedRoles)];

  const displayedRoles: RoleGroupedItem[] =
    activeCategory === 'All'
      ? Object.values(groupedRoles).flat()
      : groupedRoles[activeCategory] || [];

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      {/* Hero Section */}
      <div className="relative text-center space-y-6 pt-4 pb-2">
        {/* Subtle Radial Glow */}
        <div
          className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-[500px] h-[280px] rounded-full bg-gradient-to-r from-[var(--accent-indigo)]/12 via-[var(--accent-violet)]/10 to-[var(--accent-pink)]/12 blur-3xl" />
        </div>



        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-indigo)]/10 border border-[var(--accent-indigo)]/25 text-xs font-semibold text-[var(--accent-indigo)] shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          <span>Precision Career &amp; Placement Intelligence Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-[var(--text)] leading-[1.1]">
          What do you want to <span className="text-brand-gradient">become</span>?
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-body">
          Search any dream job, role, or technical aspiration. We map the verified market standard,
          calculate your true gaps, and generate an adaptive study roadmap.
        </p>

        {/* Search Bar Container */}
        <div className="max-w-2xl mx-auto relative" ref={dropdownRef}>
          <div className="relative flex items-center h-16 rounded-2xl bg-[var(--bg-elev-1)] border-2 border-[var(--border)] focus-within:border-[var(--accent-indigo)] focus-within:ring-4 focus-within:ring-[var(--accent-indigo)]/15 shadow-xl transition-all">
            <div className="pl-5 pr-3 text-[var(--text-muted)] flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-[var(--text-faint)]" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 2 || effectiveSuggestions.length > 0) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. SDE Tier 1, Cardiologist, ML Engineer, Civil Engineer, Pilot..."
              className="w-full h-full bg-transparent text-base text-[var(--text)] placeholder-[var(--text-faint)] outline-none focus:outline-none border-none focus:border-none ring-0 focus:ring-0 shadow-none pr-32 font-body"
              autoComplete="off"
            />

            <div className="absolute right-2 flex items-center gap-2">
              {isLoadingSuggestions && (
                <Loader2 className="w-4 h-4 text-[var(--accent-sky)] animate-spin" />
              )}
              <button
                type="button"
                onClick={() => {
                  if (query.trim() && !isResolving) onSelectRole(query.trim());
                }}
                disabled={!query.trim() || isResolving}
                className="h-11 px-5 rounded-xl bg-gradient-to-r from-[var(--accent-indigo)] to-[var(--accent-violet)] text-white text-sm font-semibold hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resolving...</span>
                  </>
                ) : (
                  <>
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Suggestions Dropdown */}
          {showDropdown && effectiveSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-18 z-50 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elev-1)] shadow-2xl p-2 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 text-left">
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-[var(--text-faint)] uppercase tracking-wider">
                <span>Matching Career Roles & Standards</span>
                <span className="text-[10px] text-[var(--accent-indigo)] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[var(--accent-amber)]" /> AI Adaptive Search
                </span>
              </div>
              {effectiveSuggestions.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectRole(item.title);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left cursor-pointer ${
                    selectedIndex === idx
                      ? 'bg-[var(--accent-indigo)] text-white'
                      : 'hover:bg-[var(--bg-elev-2)] text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 rounded-lg bg-[var(--bg-elev-2)]">
                      {getRoleIcon(item.category)}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-bold font-display truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.id.startsWith('custom_') && (
                          <span
                            className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                              selectedIndex === idx
                                ? 'bg-white/25 text-white'
                                : 'bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/25'
                            }`}
                          >
                            AI Track
                          </span>
                        )}
                      </div>
                      <div className={`text-xs truncate ${selectedIndex === idx ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                        {item.tagline}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 uppercase ${
                      selectedIndex === idx
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--accent-sky)]/10 text-[var(--accent-sky)] border border-[var(--accent-sky)]/20'
                    }`}
                  >
                    {item.demand_level}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Example Prompt Chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-[var(--text-faint)] font-mono">Popular searches:</span>
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onSelectRole(ex)}
              className="text-xs px-3 py-1.5 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Return / Fast Exploration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Welcome Back Card (if profile exists) */}
        {profile && roadmap ? (
          <div className="p-6 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1 font-mono">
                <span>ACTIVE ROADMAP</span>
                <span className="text-[var(--accent-mint)] font-bold">In Progress</span>
              </div>
              <h3 className="text-xl font-bold font-display text-[var(--text)]">
                Welcome back, {profile.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Targeting <strong className="text-[var(--text)]">{profile.target_role}</strong> ·{' '}
                {roadmap.total_estimated_hours} hours total · v{(Number(roadmap?.version) || 1).toFixed(1)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentSection('dashboard')}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-indigo)] text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Continue My Roadmap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSection('assess')}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
              >
                Log Assessment
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-sky)] uppercase font-mono mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Career Synthesis</span>
              </div>
              <h3 className="text-xl font-bold font-display text-[var(--text)]">
                Build Your Personalized Roadmap
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Search your dream job above to discover industry benchmark skills, calibrate your starting comfort, and synthesize your adaptive execution plan.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-indigo)] font-semibold">
              <span>Type your target role above to begin →</span>
            </div>
          </div>
        )}

        {/* Methodology Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-amber)] uppercase font-mono mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Deterministic Core</span>
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--text)]">
              No Hallucinations. Pure Precision.
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              Every requirement is verified from live roadmap standards. Skill gaps are strictly calculated with{' '}
              <code className="text-[var(--text)] bg-[var(--bg-elev-2)] px-1.5 py-0.5 rounded font-mono text-[11px]">
                Gap = max(0, Req − Cur)
              </code>
              . When you score higher, the agent adapts your timeline mathematically.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-faint)]">
            <span className="flex items-center gap-1.5 text-[var(--accent-mint)]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Zero Math Drift
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Real-time Adaptation
            </span>
          </div>
        </div>
      </div>

      {/* Trending Roles Directory */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-[var(--text)]">
              Explore Career Curriculums
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Select any curated career track to personalize your baseline.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[var(--accent-indigo)] text-white shadow-sm'
                    : 'bg-[var(--bg-elev-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRoles.map((role) => (
            <div
              key={role.id}
              onClick={() => onSelectRole(role.title)}
              className="p-5 rounded-2xl bg-[var(--bg-elev-1)] border border-[var(--border)] hover:border-[var(--accent-indigo)]/50 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[var(--bg-elev-2)] group-hover:scale-105 transition-transform">
                    {getRoleIcon(role.category)}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-sky)]/10 text-[var(--accent-sky)] border border-[var(--accent-sky)]/20 uppercase">
                    {role.demand_level}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold font-display text-[var(--text)] group-hover:text-[var(--accent-indigo)] transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                    {role.tagline}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-faint)]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--accent-amber)]" />
                    ≈ {role.avg_time_to_ready_weeks} weeks
                  </span>
                  <span className="flex items-center gap-1 text-[var(--accent-indigo)] font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Tune Plan</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>

                {/* Top Skills Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {role.top_skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-elev-2)] text-[var(--text-muted)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
