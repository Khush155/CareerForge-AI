/**
 * Domain detection and theming utilities for CareerForge AI.
 *
 * Detects the career domain (tech, medicine, finance, law, core_engineering, general)
 * from a target role string and provides domain-appropriate colors, icons, and labels
 * to the frontend components.
 */

export type CareerDomain = 'tech' | 'medicine' | 'finance' | 'law' | 'core_engineering' | 'culinary' | 'general';

const CULINARY_KW = new Set([
  'cook', 'chef', 'baker', 'bakery', 'pastry', 'sous', 'culinary',
  'cuisine', 'barista', 'sommelier', 'gastronomy', 'kitchen', 'restaurant',
  'food', 'hospitality', 'haccp', 'butcher', 'caterer', 'catering',
  'line cook', 'prep cook', 'head chef', 'executive chef',
]);

const MEDICINE_KW = new Set([
  'doctor', 'physician', 'surgeon', 'surgery', 'cardio', 'cardiologist',
  'nurse', 'nursing', 'dentist', 'dental', 'pharmacist', 'pharmacy',
  'radiologist', 'radiology', 'pediatrician', 'pediatric', 'oncologist',
  'neurologist', 'orthopedic', 'psychiatrist', 'dermatologist',
  'anesthesiologist', 'medical', 'medicine', 'mbbs', 'clinical', 'clinic',
  'hospital', 'healthcare', 'biotech', 'veterinarian', 'pathologist',
  'obstetrician', 'gynecologist', 'ophthalmologist', 'urologist',
]);

const FINANCE_KW = new Set([
  'invest', 'investment', 'bank', 'banking', 'equity', 'hedge', 'quant',
  'chartered', 'audit', 'auditor', 'accountant', 'accounting', 'trader',
  'trading', 'wealth', 'actuary', 'cfa', 'valuation', 'fintech',
  'taxation', 'financial', 'finance', 'economist', 'treasury',
  'portfolio', 'asset', 'fund', 'insurance', 'underwriter',
  'stockbroker', 'brokerage',
]);

const LAW_KW = new Set([
  'law', 'lawyer', 'legal', 'attorney', 'litigation', 'litigator',
  'advocate', 'judge', 'judicial', 'prosecutor', 'arbitration',
  'arbitrator', 'counsel', 'barrister', 'solicitor', 'paralegal',
  'compliance',
]);

const CORE_ENG_KW = new Set([
  'mechanical', 'civil', 'aerospace', 'aeronautical', 'electrical',
  'chemical engineer', 'structural', 'automobile', 'automotive', 'metallurgy',
  'mechatronics', 'biomedical engineer', 'environmental engineer',
  'industrial engineer', 'petroleum', 'manufacturing engineer',
]);

/**
 * Match a keyword set against tokens/text.
 * Short keywords (len <= 3, e.g. 'cfa', 'law') use whole-word token matching only
 * to prevent false positives (e.g. 'ca' matching 'mechanical').
 * Longer keywords also check substring in full text.
 */
function kwMatch(kwSet: Set<string>, tokens: Set<string>, text: string): boolean {
  for (const kw of kwSet) {
    if (kw.length <= 3) {
      if (tokens.has(kw)) return true;
    } else {
      if (tokens.has(kw) || text.includes(kw)) return true;
    }
  }
  return false;
}

/** Detect career domain from a role title string. */
export function detectDomain(targetRole: string): CareerDomain {
  const text = targetRole.toLowerCase();
  const tokens = new Set(text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean));

  if (kwMatch(MEDICINE_KW, tokens, text)) return 'medicine';
  if (kwMatch(LAW_KW, tokens, text)) return 'law';
  if (kwMatch(FINANCE_KW, tokens, text)) return 'finance';
  if (kwMatch(CORE_ENG_KW, tokens, text)) return 'core_engineering';
  if (kwMatch(CULINARY_KW, tokens, text)) return 'culinary';

  // Explicit tech role markers (checked as substrings — all are long enough)
  const techMarkers = [
    'software', 'developer', 'devops', 'frontend', 'backend', 'cloud',
    'machine learning', 'data science', 'data scientist', 'data engineer',
    'machine learning engineer', 'ai engineer', 'sde', 'swe', 'full stack',
    'fullstack', 'qa automation', 'sdet', 'cybersecurity', 'web developer',
  ];
  for (const kw of techMarkers) { if (text.includes(kw)) return 'tech'; }

  const softwareQualifiers = ['software', 'systems', 'cloud', 'platform', 'infrastructure', 'firmware', 'embedded', 'network', 'devops', 'sre', 'security', 'data', 'ai', 'ml', 'web', 'app', 'code'];
  if (tokens.has('engineer') && softwareQualifiers.some((q) => text.includes(q))) return 'tech';
  if (tokens.has('developer') || tokens.has('programmer') || tokens.has('coder')) return 'tech';

  return 'general';
}

/** Also detect domain from a phase title if target_role is unavailable. */
export function detectDomainFromPhaseTitle(phaseTitle: string): CareerDomain {
  return detectDomain(phaseTitle);
}

// ──────────────────────────────────────────────────────────────────────────────
// Domain theme configurations
// ──────────────────────────────────────────────────────────────────────────────

export interface DomainTheme {
  /** Primary accent CSS var token (e.g. 'var(--accent-emerald)') */
  accent: string;
  /** Secondary accent for gradients */
  accentSecondary: string;
  /** Background tint class (Tailwind-style using CSS var) */
  bgTint: string;
  /** Badge background class */
  badgeBg: string;
  /** Badge text class */
  badgeText: string;
  /** Badge border class */
  badgeBorder: string;
  /** Human-readable domain label */
  label: string;
  /** Emoji icon for the domain */
  emoji: string;
  /** Phase icon names from lucide-react */
  phaseIcons: [string, string, string, string]; // [phase1, phase2, phase3, final]
  /** Final phase label */
  finalPhaseLabel: string;
}

export const DOMAIN_THEMES: Record<CareerDomain, DomainTheme> = {
  tech: {
    accent: 'var(--accent-indigo)',
    accentSecondary: 'var(--accent-sky)',
    bgTint: 'bg-[var(--accent-indigo)]/5',
    badgeBg: 'bg-[var(--accent-indigo)]/10',
    badgeText: 'text-[var(--accent-indigo)]',
    badgeBorder: 'border-[var(--accent-indigo)]/30',
    label: 'Software & Technology',
    emoji: '⚙️',
    phaseIcons: ['Code2', 'Layers', 'Server', 'Trophy'],
    finalPhaseLabel: 'Placement Readiness & Technical Interviews',
  },
  medicine: {
    accent: 'var(--accent-emerald)',
    accentSecondary: 'var(--accent-sky)',
    bgTint: 'bg-[var(--accent-emerald)]/5',
    badgeBg: 'bg-[var(--accent-emerald)]/10',
    badgeText: 'text-[var(--accent-emerald)]',
    badgeBorder: 'border-[var(--accent-emerald)]/30',
    label: 'Medicine & Healthcare',
    emoji: '🩺',
    phaseIcons: ['Stethoscope', 'FlaskConical', 'Hospital', 'GraduationCap'],
    finalPhaseLabel: 'Board Exams, Residency & Career Placement',
  },
  finance: {
    accent: 'var(--accent-amber)',
    accentSecondary: 'var(--accent-coral)',
    bgTint: 'bg-[var(--accent-amber)]/5',
    badgeBg: 'bg-[var(--accent-amber)]/10',
    badgeText: 'text-[var(--accent-amber)]',
    badgeBorder: 'border-[var(--accent-amber)]/30',
    label: 'Finance & Banking',
    emoji: '📊',
    phaseIcons: ['BarChart3', 'TrendingUp', 'Briefcase', 'Trophy'],
    finalPhaseLabel: 'Finance Interview Drills & Career Placement',
  },
  law: {
    accent: 'var(--accent-indigo)',
    accentSecondary: 'var(--accent-sky)',
    bgTint: 'bg-[var(--accent-indigo)]/5',
    badgeBg: 'bg-[var(--accent-indigo)]/10',
    badgeText: 'text-[var(--accent-indigo)]',
    badgeBorder: 'border-[var(--accent-indigo)]/30',
    label: 'Law & Legal Services',
    emoji: '⚖️',
    phaseIcons: ['BookMarked', 'FileText', 'Scale', 'GraduationCap'],
    finalPhaseLabel: 'Bar Exam, Moot Court & Career Placement',
  },
  core_engineering: {
    accent: 'var(--accent-sky)',
    accentSecondary: 'var(--accent-indigo)',
    bgTint: 'bg-[var(--accent-sky)]/5',
    badgeBg: 'bg-[var(--accent-sky)]/10',
    badgeText: 'text-[var(--accent-sky)]',
    badgeBorder: 'border-[var(--accent-sky)]/30',
    label: 'Core Engineering',
    emoji: '🔧',
    phaseIcons: ['Wrench', 'Cog', 'Factory', 'Trophy'],
    finalPhaseLabel: 'Certification, Portfolio & Career Placement',
  },
  culinary: {
    accent: 'var(--accent-amber)',
    accentSecondary: 'var(--accent-coral)',
    bgTint: 'bg-[var(--accent-amber)]/5',
    badgeBg: 'bg-[var(--accent-amber)]/10',
    badgeText: 'text-[var(--accent-amber)]',
    badgeBorder: 'border-[var(--accent-amber)]/30',
    label: 'Culinary Arts & Hospitality',
    emoji: '🍳',
    phaseIcons: ['Flame', 'Award', 'Star', 'Trophy'],
    finalPhaseLabel: 'Practical Tasting Trial, Kitchen Leadership & Placement',
  },
  general: {
    accent: 'var(--accent-violet)',
    accentSecondary: 'var(--accent-sky)',
    bgTint: 'bg-[var(--accent-violet)]/5',
    badgeBg: 'bg-[var(--accent-violet)]/10',
    badgeText: 'text-[var(--accent-violet)]',
    badgeBorder: 'border-[var(--accent-violet)]/30',
    label: 'Professional Career',
    emoji: '🎯',
    phaseIcons: ['BookOpen', 'Layers', 'Star', 'Trophy'],
    finalPhaseLabel: 'Career Placement & Portfolio Presentation',
  },
};

/** Get domain theme object for a target role. */
export function getDomainTheme(targetRole: string): DomainTheme {
  return DOMAIN_THEMES[detectDomain(targetRole)];
}

/** Check if a phase is the final (placement) phase by title keywords. */
export function isFinalPhase(phaseTitle: string): boolean {
  const t = phaseTitle.toLowerCase();
  return (
    t.includes('placement') ||
    t.includes('board exam') ||
    t.includes('bar exam') ||
    t.includes('certification') ||
    t.includes('interview') ||
    t.includes('capstone') ||
    t.includes('readiness') ||
    t.includes('defense')
  );
}
