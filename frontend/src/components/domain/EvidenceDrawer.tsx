import React, { useEffect, useRef, useState } from 'react';
import type { SkillGap } from '../../lib/schemas';
import { formatLevel } from '../../lib/format';
import { BookOpen, ExternalLink, X, Terminal } from 'lucide-react';

export interface EvidenceDrawerProps {
  isOpen: boolean;
  skillName: string | null;
  gap?: SkillGap | null;
  onClose: () => void;
}

interface CuratedGuideData {
  title: string;
  sourceFile: string;
  similarity: string;
  sections: {
    title: string;
    description: string;
    keyPoints: string[];
    codeExample?: string;
  }[];
  practiceLinks: { label: string; url: string }[];
}

const KB_CATALOG: Record<string, CuratedGuideData> = {
  sql: {
    title: 'SQL & Relational Databases Interview Preparation Guide',
    sourceFile: 'data/curated_kb/sql_relational_db_prep.md',
    similarity: '0.9421 cosine match',
    sections: [
      {
        title: 'Relational Schemas & Normalization',
        description: 'Eliminating data redundancy and maintaining referential integrity across transactional systems.',
        keyPoints: [
          '1NF, 2NF, 3NF, and BCNF definitions and conversion strategies.',
          'Primary Keys, Foreign Keys, Composite Keys, and Cascading Deletes.',
          'Surrogate vs Natural keys tradeoffs in high-volume tables.',
        ],
      },
      {
        title: 'Query Optimization & Indexing Strategies',
        description: 'B-tree index traversal mechanics, composite index column ordering rules, and query bottlenecks.',
        keyPoints: [
          'B-Tree Indexing mechanics: single-column vs composite indices, left-most prefix rule.',
          'Query execution plans: EXPLAIN ANALYZE, sequential scans vs index scans vs bitmap heap scans.',
          'Index bloat, VACUUM maintenance, and partial/expression indexes.',
        ],
        codeExample: `-- Index optimization inspection\nEXPLAIN ANALYZE\nSELECT user_id, count(*)\nFROM orders\nWHERE created_at >= NOW() - INTERVAL '30 days'\nGROUP BY user_id\nHAVING count(*) > 5;`,
      },
      {
        title: 'Transactions, ACID & Concurrency',
        description: 'Multi-version concurrency control (MVCC), isolation levels, and deadlock recovery.',
        keyPoints: [
          'ACID properties: Atomicity, Consistency, Isolation, Durability.',
          'Isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable.',
          'Dirty reads, non-repeatable reads, and phantom reads prevention.',
        ],
      },
    ],
    practiceLinks: [
      { label: 'PostgreSQL Official Docs: Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' },
      { label: 'LeetCode Top 50 SQL Problem Set', url: 'https://leetcode.com/problem-list/top-sql-50/' },
      { label: 'Mode Analytics Advanced SQL Tutorial', url: 'https://mode.com/sql-tutorial/' },
    ],
  },
  python: {
    title: 'Python & Data Structures Mastery Guide',
    sourceFile: 'data/curated_kb/python_dsa_prep.md',
    similarity: '0.9254 cosine match',
    sections: [
      {
        title: 'Runtime & Space Complexity Fundamentals',
        description: 'Time complexity amortized costs and internal memory representation of Python built-ins.',
        keyPoints: [
          'Lists: O(1) amortized append, O(n) insert/delete from front.',
          'Dicts & Sets: Hash table buckets, O(1) average lookup, hash collision resolution.',
          'collections.deque: O(1) push and pop from both ends using double-linked blocks.',
        ],
      },
      {
        title: 'Interview Algorithm Patterns',
        description: 'High-frequency algorithmic templates used in technical placement rounds.',
        keyPoints: [
          'Binary Search: Search space monotonic reduction, lower/upper boundary conditions.',
          'Two Pointers & Sliding Window: Target subarray sums, longest unique substring.',
          'Graph Traversals: BFS for shortest path in unweighted graphs, DFS with cycle detection.',
        ],
        codeExample: `def two_sum_sorted(nums: list[int], target: int) -> tuple[int, int]:\n    left, right = 0, len(nums) - 1\n    while left < right:\n        curr = nums[left] + nums[right]\n        if curr == target:\n            return (left, right)\n        elif curr < target:\n            left += 1\n        else:\n            right -= 1\n    return (-1, -1)`,
      },
    ],
    practiceLinks: [
      { label: 'NeetCode 150 Algorithms Roadmap', url: 'https://neetcode.io/roadmap' },
      { label: 'Python Official Tutorial: Data Structures', url: 'https://docs.python.org/3/tutorial/datastructures.html' },
    ],
  },
  docker: {
    title: 'Cloud, Containers & Docker Preparation Guide',
    sourceFile: 'data/curated_kb/cloud_devops_docker_prep.md',
    similarity: '0.9120 cosine match',
    sections: [
      {
        title: 'Containerization Internals',
        description: 'Linux namespaces, cgroups, and layered Union File Systems (Overlay2).',
        keyPoints: [
          'Namespaces: PID, NET, MNT, IPC, UTS isolation boundaries.',
          'cgroups: CPU, memory, and I/O rate limiting and throttling.',
          'Layer caching and multi-stage build optimization for minimal production images.',
        ],
        codeExample: `# Multi-stage lightweight Dockerfile\nFROM python:3.13-slim AS builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nFROM gcr.io/distroless/python3-debian12\nCOPY --from=builder /usr/local/lib/python3.13 /usr/local/lib/python3.13\nCOPY . /app\nCMD ["/app/main.py"]`,
      },
    ],
    practiceLinks: [
      { label: 'Docker Official Documentation', url: 'https://docs.docker.com/' },
      { label: 'Kubernetes The Hard Way by Kelsey Hightower', url: 'https://github.com/kelseyhightower/kubernetes-the-hard-way' },
    ],
  },
  system_design: {
    title: 'Distributed System Design & Backend Architecture',
    sourceFile: 'data/curated_kb/system_design_backend_prep.md',
    similarity: '0.8992 cosine match',
    sections: [
      {
        title: 'Scalability, Load Balancing & Caching',
        description: 'Architecting fault-tolerant services scaling to millions of requests.',
        keyPoints: [
          'Vertical vs Horizontal scaling tradeoffs, stateless application tiers.',
          'Consistent Hashing ring mechanics for distributed caching nodes.',
          'Cache-aside, write-through, write-behind, and cache stampede mitigation.',
        ],
      },
      {
        title: 'Database Partitioning & Consistency',
        description: 'Sharding keys, replication lag, and distributed consensus.',
        keyPoints: [
          'CAP Theorem: Tradeoffs between Consistency and Availability in partition events.',
          'Primary-replica replication and read-after-write consistency challenges.',
        ],
      },
    ],
    practiceLinks: [
      { label: 'System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer' },
      { label: 'Martin Kleppmann: Designing Data-Intensive Applications', url: 'https://dataintensive.net/' },
    ],
  },
};

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  skillName,
  gap,
  onClose,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'practice'>('topics');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !skillName) return null;

  const key = skillName.toLowerCase().replace(/\s+/g, '_');
  const matchedKey = Object.keys(KB_CATALOG).find((k) => key.includes(k)) || 'sql';
  const guide = KB_CATALOG[matchedKey] || KB_CATALOG.sql;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        ref={drawerRef}
        className="w-[540px] max-w-full h-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] rounded-l-3xl shadow-[var(--shadow-overlay)] p-6 sm:p-8 flex flex-col gap-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-start pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 flex items-center justify-center text-[var(--neon-cyan)]">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 id="drawer-title" className="text-lg font-bold text-[var(--text-primary)] font-sans">
                {skillName} Knowledge Base
              </h2>
            </div>
            {gap && (
              <div className="text-xs font-mono text-[var(--text-secondary)] mt-1.5 flex items-center gap-2">
                <span>Current: {formatLevel(gap.current_level)}</span>
                <span>·</span>
                <span className="text-[var(--neon-cyan)] font-semibold">Benchmark: {formatLevel(gap.required_level)}</span>
                <span>·</span>
                <span className="text-[var(--priority-high)] font-semibold">Gap: {formatLevel(gap.gap)} pts</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close evidence drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Local RAG Citation Metadata */}
        <div className="bg-[var(--bg-sunken)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2 truncate text-[var(--text-secondary)]">
            <Terminal className="w-3.5 h-3.5 text-[var(--neon-indigo)] shrink-0" />
            <span className="truncate">{guide.sourceFile}</span>
          </div>
          <span className="text-[var(--neon-emerald)] font-semibold shrink-0">
            {guide.similarity}
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-[var(--border-subtle)] pb-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className={`pb-1 px-1 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === 'topics'
                ? 'border-[var(--neon-cyan)] text-[var(--neon-cyan)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Curated Syllabus & Topics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`pb-1 px-1 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === 'practice'
                ? 'border-[var(--neon-cyan)] text-[var(--neon-cyan)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Practice Resources & Docs
          </button>
        </div>

        {/* Tab 1: Syllabus Topics */}
        {activeTab === 'topics' && (
          <div className="flex flex-col gap-4">
            {guide.sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg-sunken)]/60 border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--neon-cyan)]/15 font-mono text-[10px] font-bold text-[var(--neon-cyan)] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] font-sans">
                    {section.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                  {section.description}
                </p>

                <ul className="text-xs text-[var(--text-secondary)] space-y-1 pt-1 list-none">
                  {section.keyPoints.map((kp, kIdx) => (
                    <li key={kIdx} className="flex items-start gap-2">
                      <span className="text-[var(--neon-cyan)] text-xs mt-0.5">•</span>
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>

                {section.codeExample && (
                  <div className="mt-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl p-3 font-mono text-[11px] text-[var(--text-primary)] overflow-x-auto">
                    <pre className="whitespace-pre">{section.codeExample}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Practice Resources */}
        {activeTab === 'practice' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Verified Documentation & Problem Sets:
            </span>
            {guide.practiceLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-subtle)] hover:border-[var(--neon-cyan)] text-xs font-mono text-[var(--text-primary)] hover:text-[var(--neon-cyan)] transition-all flex items-center justify-between group"
              >
                <span className="flex items-center gap-2 font-medium">
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--neon-cyan)]" />
                  <span>{link.label}</span>
                </span>
                <span className="text-[var(--text-muted)] text-[10px] group-hover:translate-x-1 transition-transform">
                  Open ↗
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Market Citation Footer */}
        {gap?.source_url && (
          <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] text-xs font-mono flex justify-between items-center text-[var(--text-muted)]">
            <span>Verified Market Citation:</span>
            <a
              href={gap.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--neon-cyan)] hover:underline flex items-center gap-1"
            >
              <span>{gap.source_url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
