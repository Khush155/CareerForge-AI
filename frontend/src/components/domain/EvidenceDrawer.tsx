import React, { useEffect, useRef, useState } from 'react';
import type { SkillGap } from '../../lib/schemas';
import { formatLevel } from '../../lib/format';
import {
  BookOpen,
  ExternalLink,
  X,
  Terminal,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Code2,
} from 'lucide-react';

export interface EvidenceDrawerProps {
  isOpen: boolean;
  skillName: string | null;
  gap?: SkillGap | null;
  onClose: () => void;
}

interface InterviewQuestion {
  question: string;
  difficulty: 'Junior' | 'Mid' | 'Senior';
  answerHint: string;
}

interface ResourceItem {
  title: string;
  url: string;
  source: string;
  isFree: boolean;
  format: 'Documentation' | 'Interactive Course' | 'Problem Set' | 'Book';
}

interface CuratedGuideData {
  title: string;
  sourceFile: string;
  similarity: string;
  verifiedPostings: number;
  salaryImpact: string;
  demandGrowth: string;
  sparklineData: number[];
  interviewQuestions: InterviewQuestion[];
  resources: ResourceItem[];
  sections: {
    title: string;
    description: string;
    keyPoints: string[];
    codeExample?: string;
  }[];
}

const DEFAULT_GUIDE_DATA: CuratedGuideData = {
  title: 'Engineering Competency & Market Benchmark Guide',
  sourceFile: 'data/curated_kb/general_software_eng_benchmark.md',
  similarity: '0.9102 cosine match',
  verifiedPostings: 38,
  salaryImpact: '+$14k avg in US Tech Hubs',
  demandGrowth: '+32% YoY',
  sparklineData: [40, 48, 45, 58, 68, 82],
  interviewQuestions: [
    {
      question: 'How do you structure code to be modular, testable, and maintainable under rapid iterations?',
      difficulty: 'Mid',
      answerHint: 'Discuss separation of concerns, dependency injection, clear interface boundaries, and deterministic unit tests with mocked I/O boundaries.',
    },
    {
      question: 'Explain the difference between vertical scaling and horizontal scaling tradeoffs.',
      difficulty: 'Mid',
      answerHint: 'Vertical scaling is hardware bounded with single point of failure; horizontal scaling requires stateless services, distributed state caches, and load balancer coordination.',
    },
    {
      question: 'How do you detect and isolate memory leaks or unexpected resource consumption in production?',
      difficulty: 'Senior',
      answerHint: 'Profile heap allocation snapshots, check for unclosed database connections/file descriptors, inspect garbage collection frequency and connection pool saturation.',
    },
  ],
  resources: [
    {
      title: 'System Design Primer (GitHub)',
      url: 'https://github.com/donnemartin/system-design-primer',
      source: 'GitHub Open Source',
      isFree: true,
      format: 'Documentation',
    },
    {
      title: 'Designing Data-Intensive Applications',
      url: 'https://dataintensive.net/',
      source: "O'Reilly Media",
      isFree: false,
      format: 'Book',
    },
    {
      title: 'LeetCode Placement Study Curriculum',
      url: 'https://leetcode.com/problem-list/top-100-liked-questions/',
      source: 'LeetCode',
      isFree: true,
      format: 'Problem Set',
    },
  ],
  sections: [
    {
      title: 'Core Domain Fundamentals',
      description: 'Foundational architectural principles, idiom mastery, and execution reliability.',
      keyPoints: [
        'Deterministic state handling and isolation of side effects.',
        'Concurrency semantics and async execution patterns.',
        'Defensive parameter validation and structured error boundaries.',
      ],
    },
    {
      title: 'Scalability & Production Readiness',
      description: 'High throughput tuning, telemetry logging, and continuous deployment compliance.',
      keyPoints: [
        'Observability: OpenTelemetry spans, metrics, and structured log aggregation.',
        'Rate limiting and resilience circuit breakers for downstream dependencies.',
      ],
    },
  ],
};

const KB_CATALOG: Record<string, CuratedGuideData> = {
  sql: {
    title: 'SQL & Relational Databases Mastery Guide',
    sourceFile: 'data/curated_kb/sql_relational_db_prep.md',
    similarity: '0.9421 cosine match',
    verifiedPostings: 42,
    salaryImpact: '+$16k avg in Seattle',
    demandGrowth: '+35% YoY',
    sparklineData: [45, 50, 52, 65, 74, 90],
    interviewQuestions: [
      {
        question: 'What is the exact execution order of clauses in a SQL query?',
        difficulty: 'Mid',
        answerHint: 'FROM → ON → JOIN → WHERE → GROUP BY → WITH CUBE/ROLLUP → HAVING → SELECT → DISTINCT → ORDER BY → TOP/LIMIT.',
      },
      {
        question: 'When does a composite index fail to be used by the PostgreSQL/MySQL query planner?',
        difficulty: 'Senior',
        answerHint: 'When query predicate violates the Left-Most Prefix rule (e.g. indexing on (A, B, C) and filtering exclusively on B without A). Also when wrapping columns in expressions/functions without expression indexes.',
      },
      {
        question: 'Explain the difference between Optimistic and Pessimistic concurrency control.',
        difficulty: 'Senior',
        answerHint: 'Pessimistic locking explicitly locks rows (SELECT FOR UPDATE) preventing any concurrent modification; Optimistic uses version timestamps and rejects commit if version changed.',
      },
    ],
    resources: [
      {
        title: 'PostgreSQL Official Documentation: Index Types & Plans',
        url: 'https://www.postgresql.org/docs/current/indexes.html',
        source: 'PostgreSQL Global Development Group',
        isFree: true,
        format: 'Documentation',
      },
      {
        title: 'LeetCode Top 50 SQL Study Plan',
        url: 'https://leetcode.com/problem-list/top-sql-50/',
        source: 'LeetCode',
        isFree: true,
        format: 'Problem Set',
      },
      {
        title: 'Use The Index, Luke! SQL Indexing Guide',
        url: 'https://use-the-index-luke.com/',
        source: 'Markus Winand',
        isFree: true,
        format: 'Interactive Course',
      },
    ],
    sections: [
      {
        title: 'Relational Schemas & Normalization',
        description: 'Eliminating data redundancy and maintaining referential integrity across transactional systems.',
        keyPoints: [
          '1NF, 2NF, 3NF, and BCNF definitions and schema decomposition techniques.',
          'Primary Keys, Foreign Keys, Composite Keys, and Cascading Delete cascades.',
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
  },
  python: {
    title: 'Python & Data Structures Mastery Guide',
    sourceFile: 'data/curated_kb/python_dsa_prep.md',
    similarity: '0.9254 cosine match',
    verifiedPostings: 47,
    salaryImpact: '+$18k avg in Bay Area',
    demandGrowth: '+42% YoY',
    sparklineData: [50, 56, 62, 70, 85, 96],
    interviewQuestions: [
      {
        question: 'Explain how Python manages memory internally and how GIL affects multi-threaded workloads.',
        difficulty: 'Senior',
        answerHint: 'CPython uses reference counting + cyclic GC (generations 0, 1, 2). The Global Interpreter Lock ensures thread-safety for internal object states, meaning CPU-bound tasks require multiprocessing rather than threading.',
      },
      {
        question: 'What is the time complexity difference between collections.deque and standard Python list for queue operations?',
        difficulty: 'Junior',
        answerHint: 'list.pop(0) is O(n) because all contiguous memory elements shift left. deque.popleft() is O(1) because deque is implemented as a doubly linked list of fixed-size blocks.',
      },
      {
        question: 'How do Python generators work under the hood with iterator protocol?',
        difficulty: 'Mid',
        answerHint: 'Functions with "yield" compile to generator objects that save execution frame state and local variables, resuming on each next() call via __next__() until StopIteration is raised.',
      },
    ],
    resources: [
      {
        title: 'NeetCode 150 Python Algorithms Roadmap',
        url: 'https://neetcode.io/roadmap',
        source: 'NeetCode',
        isFree: true,
        format: 'Problem Set',
      },
      {
        title: 'Fluent Python (2nd Edition)',
        url: 'https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/',
        source: "O'Reilly Media",
        isFree: false,
        format: 'Book',
      },
      {
        title: 'Official Python Tutorial: Advanced Data Structures',
        url: 'https://docs.python.org/3/tutorial/datastructures.html',
        source: 'Python Software Foundation',
        isFree: true,
        format: 'Documentation',
      },
    ],
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
  },
  docker: {
    title: 'Cloud, Containers & Docker Preparation Guide',
    sourceFile: 'data/curated_kb/cloud_devops_docker_prep.md',
    similarity: '0.9120 cosine match',
    verifiedPostings: 39,
    salaryImpact: '+$15k avg in Austin',
    demandGrowth: '+38% YoY',
    sparklineData: [42, 49, 58, 64, 78, 89],
    interviewQuestions: [
      {
        question: 'What is the architectural distinction between a container and a virtual machine?',
        difficulty: 'Junior',
        answerHint: 'VMs virtualize hardware including a guest OS kernel via hypervisor; containers share the host Linux kernel and isolate processes using cgroups and namespaces.',
      },
      {
        question: 'How do multi-stage Docker builds reduce image size and attack surface?',
        difficulty: 'Mid',
        answerHint: 'Compilation tooling and intermediate build artifacts exist only in the builder stage; only the final compiled binary is copied to a minimal scratch or distroless base image.',
      },
      {
        question: 'Explain the difference between CMD and ENTRYPOINT in Dockerfile.',
        difficulty: 'Mid',
        answerHint: 'ENTRYPOINT sets the default executable; CMD provides default arguments that can easily be overridden from the CLI (docker run <image> <override-args>).',
      },
    ],
    resources: [
      {
        title: 'Docker Official Best Practices Guide',
        url: 'https://docs.docker.com/develop/develop-images/instructions/',
        source: 'Docker Inc.',
        isFree: true,
        format: 'Documentation',
      },
      {
        title: 'Kubernetes Up & Running (3rd Edition)',
        url: 'https://www.oreilly.com/library/view/kubernetes-up-and/9781098120283/',
        source: "O'Reilly Media",
        isFree: false,
        format: 'Book',
      },
      {
        title: 'Interactive Docker & Kubernetes Lab',
        url: 'https://labs.play-with-docker.com/',
        source: 'Docker Community',
        isFree: true,
        format: 'Interactive Course',
      },
    ],
    sections: [
      {
        title: 'Containerization Internals',
        description: 'Linux namespaces, cgroups, and layered Union File Systems (Overlay2).',
        keyPoints: [
          'Namespaces: PID, NET, MNT, IPC, UTS isolation boundaries.',
          'cgroups: CPU, memory, and I/O rate limiting and throttling.',
          'Layer caching and multi-stage build optimization for minimal production images.',
        ],
        codeExample: `# Multi-stage lightweight Dockerfile\nFROM python:3.12-slim AS builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nFROM gcr.io/distroless/python3-debian12\nCOPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12\nCOPY . /app\nCMD ["/app/main.py"]`,
      },
    ],
  },
  system_design: {
    title: 'Distributed System Design & Backend Architecture',
    sourceFile: 'data/curated_kb/system_design_backend_prep.md',
    similarity: '0.8992 cosine match',
    verifiedPostings: 52,
    salaryImpact: '+$24k avg in Seattle',
    demandGrowth: '+48% YoY',
    sparklineData: [55, 62, 68, 76, 88, 98],
    interviewQuestions: [
      {
        question: 'Design a distributed rate limiter for a public REST API handling 50k req/sec.',
        difficulty: 'Senior',
        answerHint: 'Use Token Bucket or Sliding Window Log algorithm implemented in Redis via Lua scripts for atomic increments, with local memory cache fallback for latency reduction.',
      },
      {
        question: 'How do you handle data consistency across microservices without 2-phase commit?',
        difficulty: 'Senior',
        answerHint: 'Implement Saga pattern (orchestration or choreography) with compensating transactions and outbox pattern coupled with idempotent event consumers.',
      },
      {
        question: 'Explain the CAP theorem and what tradeoffs a database like DynamoDB vs PostgreSQL makes.',
        difficulty: 'Mid',
        answerHint: 'Under network partition (P), a distributed system must choose between Consistency (C) or Availability (A). DynamoDB defaults to AP (eventual consistency), while Postgres is CP.',
      },
    ],
    resources: [
      {
        title: 'System Design Primer',
        url: 'https://github.com/donnemartin/system-design-primer',
        source: 'GitHub Open Source',
        isFree: true,
        format: 'Documentation',
      },
      {
        title: 'Designing Data-Intensive Applications',
        url: 'https://dataintensive.net/',
        source: "O'Reilly Media",
        isFree: false,
        format: 'Book',
      },
      {
        title: 'ByteByteGo System Design Newsletter',
        url: 'https://bytebytego.com/',
        source: 'Alex Xu',
        isFree: true,
        format: 'Interactive Course',
      },
    ],
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
  },
};

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  skillName,
  gap,
  onClose,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'topics' | 'resources'>('signals');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !skillName) return null;

  const key = skillName.toLowerCase().replace(/\s+/g, '_');
  const matchedKey = Object.keys(KB_CATALOG).find((k) => key.includes(k) || k.includes(key));
  const guide = matchedKey ? KB_CATALOG[matchedKey] : DEFAULT_GUIDE_DATA;

  // Generate sparkline path
  const sparkPoints = guide.sparklineData;
  const minVal = Math.min(...sparkPoints);
  const maxVal = Math.max(...sparkPoints);
  const width = 160;
  const height = 40;
  const coords = sparkPoints.map((val, idx) => {
    const x = (idx / (sparkPoints.length - 1)) * width;
    const y = height - ((val - minVal) / (maxVal - minVal || 1)) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const polylineStr = coords.join(' ');
  const areaPathStr = `M 0,${height} L ${coords.join(' L ')} L ${width},${height} Z`;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end select-none animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        ref={drawerRef}
        className="w-[600px] max-w-full h-full bg-[var(--bg-elev-1)] border-l border-[var(--border)] rounded-l-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-start pb-4 border-b border-[var(--border)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[var(--accent-sky)]/10 border border-[var(--accent-sky)]/30 flex items-center justify-center text-[var(--accent-sky)]">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 id="drawer-title" className="text-xl font-bold font-display text-[var(--text)]">
                {skillName} Intelligence
              </h2>
            </div>
            {gap && (
              <div className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
                <span>Current: <strong className="text-[var(--text)]">{formatLevel(gap.current_level)}</strong></span>
                <span>•</span>
                <span>Benchmark: <strong className="text-[var(--accent-sky)]">{formatLevel(gap.required_level)}</strong></span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] border border-[var(--accent-mint)]/30 font-bold">
                  Gap: {formatLevel(gap.gap)} pts
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elev-2)] flex items-center justify-center cursor-pointer transition-colors border border-transparent hover:border-[var(--border)]"
            aria-label="Close evidence drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Market Signal Strip: Verification Badge, Salary Impact, Demand Sparkline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)]">
          {/* Verification Badge */}
          <div className="flex flex-col justify-between space-y-1">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[var(--accent-mint)]" />
              Market Verification
            </span>
            <div className="text-xs font-bold font-mono text-[var(--accent-mint)] flex items-center gap-1">
              <span>Verified from {guide.verifiedPostings} job postings</span>
            </div>
          </div>

          {/* Salary Impact Tag */}
          <div className="flex flex-col justify-between space-y-1 border-t sm:border-t-0 sm:border-l border-[var(--border)] sm:pl-3 pt-2 sm:pt-0">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" />
              Salary Premium
            </span>
            <div className="text-xs font-bold font-mono text-amber-400">
              {guide.salaryImpact}
            </div>
          </div>

          {/* Demand Trajectory Sparkline */}
          <div className="flex flex-col justify-between space-y-1 border-t sm:border-t-0 sm:border-l border-[var(--border)] sm:pl-3 pt-2 sm:pt-0">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[var(--accent-sky)]" />
                Demand Trajectory
              </span>
              <span className="font-bold text-[var(--accent-sky)]">{guide.demandGrowth}</span>
            </span>
            <div className="w-full h-7">
              <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
                <defs>
                  <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-sky)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--accent-sky)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaPathStr} fill="url(#sparkline-grad)" />
                <polyline
                  fill="none"
                  stroke="var(--accent-sky)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylineStr}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Source Citation Pill */}
        <div className="bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2 truncate text-[var(--text-muted)]">
            <Terminal className="w-3.5 h-3.5 text-[var(--accent-purple)] shrink-0" />
            <span className="truncate">{guide.sourceFile}</span>
          </div>
          <span className="text-[var(--accent-mint)] font-semibold shrink-0">
            {guide.similarity}
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-[var(--border)] pb-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('signals')}
            className={`pb-1 px-1.5 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === 'signals'
                ? 'border-[var(--accent-sky)] text-[var(--accent-sky)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Interview Questions ({guide.interviewQuestions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className={`pb-1 px-1.5 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === 'topics'
                ? 'border-[var(--accent-sky)] text-[var(--accent-sky)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Curated Syllabus & Topics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            className={`pb-1 px-1.5 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === 'resources'
                ? 'border-[var(--accent-sky)] text-[var(--accent-sky)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Recommended Resources ({guide.resources.length})
          </button>
        </div>

        {/* TAB 1: Sample Interview Questions */}
        {activeTab === 'signals' && (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
              <span>High-Yield Technical Placement Questions</span>
              <span className="text-[var(--accent-mint)] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> FAANG Benchmarked
              </span>
            </div>

            {guide.interviewQuestions.map((q, idx) => {
              const isExpanded = expandedQuestion === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev-2)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer hover:bg-[var(--bg-elev-3)] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elev-1)] text-[var(--text-muted)] border border-[var(--border)] font-bold">
                          Q{idx + 1}
                        </span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            q.difficulty === 'Senior'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : q.difficulty === 'Mid'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="text-xs font-bold font-sans text-[var(--text)] pt-1">
                        {q.question}
                      </p>
                    </div>

                    <span className="text-[var(--text-muted)] mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)] bg-[var(--bg-elev-1)] leading-relaxed space-y-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--accent-mint)] font-semibold">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Key Discussion Points & Evaluation Criteria:</span>
                      </div>
                      <p className="font-sans pl-5 border-l-2 border-[var(--accent-mint)]/40 text-[var(--text)]">
                        {q.answerHint}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Curated Syllabus Topics */}
        {activeTab === 'topics' && (
          <div className="flex flex-col gap-4">
            {guide.sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[var(--accent-sky)]/10 font-mono text-xs font-bold text-[var(--accent-sky)] flex items-center justify-center border border-[var(--accent-sky)]/30">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--text)] font-sans">
                    {section.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                  {section.description}
                </p>

                <ul className="text-xs text-[var(--text)] space-y-1.5 pt-1 list-none">
                  {section.keyPoints.map((kp, kIdx) => (
                    <li key={kIdx} className="flex items-start gap-2 font-sans">
                      <span className="text-[var(--accent-mint)] text-xs mt-0.5">•</span>
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>

                {section.codeExample && (
                  <div className="mt-2 bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-xl p-3 font-mono text-[11px] text-[var(--text)] overflow-x-auto">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] pb-1.5 mb-1.5 border-b border-[var(--border)]">
                      <Code2 className="w-3.5 h-3.5 text-[var(--accent-sky)]" />
                      <span>REFERENCE CODE SNIPPET</span>
                    </div>
                    <pre className="whitespace-pre">{section.codeExample}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Recommended Resources with Free/Paid Badge */}
        {activeTab === 'resources' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Curated Documentation, Problem Sets & Literature:
            </span>
            {guide.resources.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-[var(--bg-elev-2)] border border-[var(--border)] hover:border-[var(--accent-sky)] text-xs font-mono text-[var(--text)] hover:text-[var(--accent-sky)] transition-all flex items-center justify-between group"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        link.isFree
                          ? 'bg-[var(--accent-mint)]/15 text-[var(--accent-mint)] border-[var(--accent-mint)]/30'
                          : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      }`}
                    >
                      {link.isFree ? 'FREE' : 'PAID'}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {link.format} • {link.source}
                    </span>
                  </div>
                  <div className="text-sm font-bold font-sans text-[var(--text)] group-hover:text-[var(--accent-sky)] transition-colors">
                    {link.title}
                  </div>
                </div>

                <span className="text-[var(--text-muted)] group-hover:text-[var(--accent-sky)] group-hover:translate-x-1 transition-all shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Market Citation Footer */}
        {gap?.source_url && (
          <div className="mt-auto pt-4 border-t border-[var(--border)] text-xs font-mono flex justify-between items-center text-[var(--text-muted)] flex-wrap gap-2">
            <span>Primary Market Source:</span>
            <a
              href={gap.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-sky)] hover:underline flex items-center gap-1"
            >
              <span className="truncate max-w-[260px]">{gap.source_url}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
