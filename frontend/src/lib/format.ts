/**
 * Formatting helpers — centralized, consistent, tabular numerals everywhere.
 */

export function formatLevel(val: number): string {
  return Number(val).toFixed(1);
}

export function formatHours(h: number): string {
  return `${Math.round(h)} h`;
}

export function formatPercent(p: number): string {
  return `${Math.round(p)}%`;
}

export function formatDelta(d: number): string {
  const sign = d > 0 ? '+' : '';
  return `${sign}${Number(d).toFixed(2)} pts`;
}

export function formatWeeks(w: number): string {
  return `≈ ${Math.round(w)} weeks`;
}

export function formatResourceRef(urlOrRef: string): string {
  if (!urlOrRef) return 'Curated Knowledge Base Guide';

  if (urlOrRef.startsWith('http://') || urlOrRef.startsWith('https://')) {
    try {
      const parsed = new URL(urlOrRef);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return 'Official Web Documentation';
    }
  }

  // Hide internal server filesystem and .md paths
  if (urlOrRef.includes('.md') || urlOrRef.includes('curated_kb') || urlOrRef.includes('/')) {
    const hashIdx = urlOrRef.indexOf('#');
    if (hashIdx !== -1) {
      const anchor = urlOrRef.slice(hashIdx + 1);
      const cleanSection = anchor
        .replace(/[-_]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (cleanSection) {
        return `Curated Knowledge Base · ${cleanSection}`;
      }
    }
    const parts = urlOrRef.split('/');
    const lastPart = parts[parts.length - 1].replace(/\.md.*$/, '');
    const cleanTopic = lastPart
      .replace(/_prep$/, '')
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (cleanTopic) {
      return `Curated Knowledge Base · ${cleanTopic}`;
    }
    return 'Curated Knowledge Base · Study Guide';
  }

  return urlOrRef;
}

export const formatKnowledgeSource = formatResourceRef;

