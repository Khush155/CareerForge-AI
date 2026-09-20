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
