import {
  PeriodKind,
  WEEKDAYS,
  dateKey,
  daysBetween,
  parseKey,
  periodRange,
  shiftPeriod,
  weekdayIndex,
} from './dates';

export type Unit = 'minutes' | 'hours' | 'times';

export interface Habit {
  id: string;
  name: string;
  amount: number;
  unit: Unit;
  period: PeriodKind;
  /** Only for period === 'week'. 0 = Mon … 6 = Sun. When set, `amount` applies to each chosen day. */
  days?: number[];
  /** YYYY-MM-DD */
  createdAt: string;
  /** Hidden from the home screen; history is kept. */
  archived?: boolean;
}

/** habitId -> YYYY-MM-DD -> amount logged that day (in the habit's unit) */
export type Logs = Record<string, Record<string, number>>;

export interface Progress {
  done: number;
  target: number;
}

const UNIT_SHORT: Record<Unit, [string, string]> = {
  minutes: ['min', 'min'],
  hours: ['hr', 'hrs'],
  times: ['time', 'times'],
};

export function unitLabel(unit: Unit, n: number, short = false): string {
  if (short) return UNIT_SHORT[unit][n === 1 ? 0 : 1];
  return n === 1 ? unit.slice(0, -1) : unit;
}

/** Habits whose goal applies to individual days (every day, or chosen weekdays). */
export function isPerDay(h: Habit): boolean {
  return h.period === 'day' || (h.period === 'week' && !!h.days?.length);
}

export function isDueOn(h: Habit, d: Date): boolean {
  if (dateKey(d) < h.createdAt) return false;
  if (h.period === 'day') return true;
  if (h.period === 'week' && h.days?.length) return h.days.includes(weekdayIndex(d));
  return false;
}

export function describeHabit(h: Pick<Habit, 'amount' | 'unit' | 'period' | 'days'>): string {
  const base = `${h.amount} ${unitLabel(h.unit, h.amount)}`;
  if (h.period === 'week' && h.days?.length) {
    if (h.days.length === 7) return `${base} every day`;
    const names = [...h.days].sort().map((i) => WEEKDAYS[i]);
    const list =
      names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
    return `${base} every ${list}`;
  }
  return `${base} every ${h.period}`;
}

export function valueOn(logs: Logs, habitId: string, d: Date): number {
  return logs[habitId]?.[dateKey(d)] ?? 0;
}

function sumRange(logs: Logs, habitId: string, start: Date, end: Date): number {
  return daysBetween(start, end).reduce((s, d) => s + valueOn(logs, habitId, d), 0);
}

/**
 * How far a habit is toward its goal within a period.
 * Returns null when the habit has no goal in that period (e.g. a weekly total on the Daily tab,
 * a Monday-only habit on a Tuesday, or a period before the habit existed).
 */
export function habitProgress(
  h: Habit,
  logs: Logs,
  kind: PeriodKind,
  start: Date,
  end: Date,
): Progress | null {
  const created = parseKey(h.createdAt);
  if (end < created) return null;

  if (isPerDay(h)) {
    const due = daysBetween(start > created ? start : created, end).filter((d) => isDueOn(h, d));
    if (!due.length) return null;
    const done = due.reduce((s, d) => s + Math.min(valueOn(logs, h.id, d), h.amount), 0);
    return { done, target: h.amount * due.length };
  }

  if (h.period === kind) {
    return { done: sumRange(logs, h.id, start, end), target: h.amount };
  }

  // A weekly total viewed over a month: scale the goal by the days in that month.
  if (h.period === 'week' && kind === 'month') {
    const days = daysBetween(start > created ? start : created, end).length;
    return { done: sumRange(logs, h.id, start, end), target: (h.amount * days) / 7 };
  }

  return null;
}

/** Progress for a habit's own period containing `d` (used by the Daily tab bars and dot borders). */
export function ownPeriodProgress(h: Habit, logs: Logs, d: Date): Progress {
  if (isPerDay(h)) return { done: valueOn(logs, h.id, d), target: h.amount };
  const { start, end } = periodRange(h.period, d);
  return { done: sumRange(logs, h.id, start, end), target: h.amount };
}

/** Overall % (0–100) across all habits for a period, or null if nothing is due. */
export function periodPercent(habits: Habit[], logs: Logs, kind: PeriodKind, anchor: Date): number | null {
  const { start, end } = periodRange(kind, anchor);
  const parts = habits
    .map((h) => habitProgress(h, logs, kind, start, end))
    .filter((p): p is Progress => p !== null)
    .map((p) => Math.min(1, p.done / p.target));
  if (!parts.length) return null;
  const allDone = parts.every((p) => p >= 1);
  const pct = Math.floor((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
  return allDone ? 100 : Math.min(pct, 99);
}

/**
 * Consecutive fully-completed periods ending now. The current period only counts once complete,
 * and an incomplete current period doesn't break the streak. Periods with nothing due are skipped.
 */
export function streak(habits: Habit[], logs: Logs, kind: PeriodKind, now: Date): number {
  if (!habits.length) return 0;
  const earliest = parseKey(habits.reduce((m, h) => (h.createdAt < m ? h.createdAt : m), habits[0].createdAt));

  let count = periodPercent(habits, logs, kind, now) === 100 ? 1 : 0;
  let anchor = shiftPeriod(kind, now, -1);
  for (let i = 0; i < 3000 && periodRange(kind, anchor).end >= earliest; i++) {
    const pct = periodPercent(habits, logs, kind, anchor);
    if (pct === 100) count++;
    else if (pct !== null) break;
    anchor = shiftPeriod(kind, anchor, -1);
  }
  return count;
}

export interface CellState {
  planned: boolean;
  fill: number;
  future: boolean;
}

/** What a single dot in the weekly/monthly grid should look like. */
export function cellState(h: Habit, logs: Logs, d: Date, now: Date): CellState {
  const value = valueOn(logs, h.id, d);
  const future = d > now;

  if (isPerDay(h)) {
    return { planned: isDueOn(h, d) || value > 0, fill: Math.min(1, value / h.amount), future };
  }

  const before = dateKey(d) < h.createdAt;
  const { done, target } = ownPeriodProgress(h, logs, d);
  const share = h.unit === 'times' ? 1 : h.amount;
  return {
    planned: value > 0 || (!before && done < target),
    fill: Math.min(1, value / share),
    future,
  };
}

/** Largest value the amount wheel offers when logging a day. */
export function logMax(h: Habit): number {
  if (h.unit === 'hours') return 24;
  if (h.unit === 'minutes') return Math.max(180, h.amount);
  return Math.max(20, h.amount);
}

/** Rounds for display; logs can hold fractions after a minutes → hours switch. */
export function roundAmount(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Rewrites one habit's logs when its unit changes:
 * minutes ↔ hours converts exactly, anything → times counts each logged day as one time,
 * and times → minutes/hours treats each time as the full (new) goal amount.
 */
export function convertLogs(dayLogs: Record<string, number>, from: Unit, to: Unit, newAmount: number): Record<string, number> {
  if (from === to) return dayLogs;
  const convert = (v: number): number => {
    if (to === 'times') return 1;
    if (from === 'times') return v * newAmount;
    return from === 'minutes' ? Math.round((v / 60) * 100) / 100 : v * 60;
  };
  const out: Record<string, number> = {};
  for (const [key, v] of Object.entries(dayLogs)) {
    if (v > 0) out[key] = convert(v);
  }
  return out;
}

/** Starting value for the log popup: what's already logged that day, otherwise the goal amount. */
export function logDefault(h: Habit, logs: Logs, d: Date): number {
  const existing = valueOn(logs, h.id, d);
  if (existing > 0) return existing;
  return Math.min(logMax(h), h.amount);
}
