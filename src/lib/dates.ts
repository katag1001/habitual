export type PeriodKind = 'day' | 'week' | 'month';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local-time YYYY-MM-DD key. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function periodRange(kind: PeriodKind, anchor: Date): { start: Date; end: Date } {
  if (kind === 'day') return { start: anchor, end: anchor };
  if (kind === 'week') {
    const start = addDays(anchor, -weekdayIndex(anchor));
    return { start, end: addDays(start, 6) };
  }
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  return { start, end: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0) };
}

export function shiftPeriod(kind: PeriodKind, anchor: Date, n: number): Date {
  if (kind === 'day') return addDays(anchor, n);
  if (kind === 'week') return addDays(anchor, 7 * n);
  return new Date(anchor.getFullYear(), anchor.getMonth() + n, 1);
}

export function periodKey(kind: PeriodKind, anchor: Date): string {
  return `${kind}:${dateKey(periodRange(kind, anchor).start)}`;
}

export function daysBetween(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function shortDate(d: Date): string {
  return `${WEEKDAYS[weekdayIndex(d)]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function periodLabel(kind: PeriodKind, anchor: Date): string {
  const now = today();
  if (kind === 'day') {
    if (dateKey(anchor) === dateKey(now)) return 'Today';
    if (dateKey(anchor) === dateKey(addDays(now, -1))) return 'Yesterday';
    return shortDate(anchor);
  }
  if (kind === 'week') {
    const { start, end } = periodRange('week', anchor);
    if (periodKey('week', anchor) === periodKey('week', now)) return 'This week';
    const s = `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)}`;
    const e = `${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`;
    return `${s} – ${e}`;
  }
  return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
}
