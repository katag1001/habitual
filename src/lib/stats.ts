import {
  PeriodKind,
  WEEKDAYS,
  addDays,
  dateKey,
  daysBetween,
  parseKey,
  periodKey,
  periodLabel,
  periodRange,
  shiftPeriod,
  shortDate,
  weekdayIndex,
} from './dates';
import { Habit, Logs, Unit, habitProgress, isDueOn, isPerDay, valueOn } from './habits';

/** The unit a habit's streak is counted in: due days for per-day habits, otherwise its own period. */
export function streakKind(h: Habit): PeriodKind {
  return isPerDay(h) ? 'day' : h.period;
}

export const KIND_NOUN: Record<PeriodKind, [string, string]> = {
  day: ['day', 'days'],
  week: ['week', 'weeks'],
  month: ['month', 'months'],
};

/** Compact amount, e.g. "45m", "3h 20m", "12h", "8×". */
export function formatAmount(unit: Unit, n: number): string {
  const r = Math.round(n * 10) / 10;
  if (unit === 'minutes') {
    const m = Math.round(n);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  }
  if (unit === 'hours') return `${r}h`;
  return `${r}×`;
}

// ── Period history ────────────────────────────────────────────────────────────

export interface PeriodStat {
  start: Date;
  done: number;
  target: number;
  met: boolean;
  /** The period containing today (still in progress). */
  current: boolean;
}

/** Every goal period from creation to now: due days for per-day habits, weeks/months otherwise. */
export function periodHistory(h: Habit, logs: Logs, now: Date): PeriodStat[] {
  const created = parseKey(h.createdAt);
  const out: PeriodStat[] = [];

  if (isPerDay(h)) {
    const nowKey = dateKey(now);
    for (const d of daysBetween(created, now)) {
      if (!isDueOn(h, d)) continue;
      const v = valueOn(logs, h.id, d);
      out.push({ start: d, done: v, target: h.amount, met: v >= h.amount, current: dateKey(d) === nowKey });
    }
    return out;
  }

  const kind = h.period;
  const nowKey = periodKey(kind, now);
  for (let anchor = periodRange(kind, created).start; anchor <= now; anchor = shiftPeriod(kind, anchor, 1)) {
    const { start, end } = periodRange(kind, anchor);
    const done = daysBetween(start, end).reduce((s, d) => s + valueOn(logs, h.id, d), 0);
    out.push({ start, done, target: h.amount, met: done >= h.amount, current: periodKey(kind, start) === nowKey });
  }
  return out;
}

/** An unfinished current period never breaks a streak. */
export function streaks(history: PeriodStat[]): { current: number; best: number } {
  let run = 0;
  let best = 0;
  for (const p of history) {
    if (p.met) best = Math.max(best, ++run);
    else if (!p.current) run = 0;
  }
  return { current: run, best };
}

/** Share of finished periods where the goal was met (the current one counts only once met). */
export function completionRate(history: PeriodStat[]): number | null {
  const counted = history.filter((p) => !p.current || p.met);
  if (!counted.length) return null;
  return counted.filter((p) => p.met).length / counted.length;
}

export function totals(h: Habit, logs: Logs): { total: number; daysLogged: number } {
  const values = Object.values(logs[h.id] ?? {}).filter((v) => v > 0);
  return { total: values.reduce((a, b) => a + b, 0), daysLogged: values.length };
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

export type ChartRange = 'week' | 'month' | 'year';

export interface Bar {
  key: string;
  label: string;
  detail: string;
  value: number;
  /** Goal for this bar, or null when there isn't one (e.g. a rest day). */
  goal: number | null;
}

export function barSeries(h: Habit, logs: Logs, range: ChartRange, now: Date): { bars: Bar[]; goalLine: number | null } {
  let bars: Bar[];

  if (range === 'year') {
    bars = Array.from({ length: 12 }, (_, i) => {
      const anchor = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const { start, end } = periodRange('month', anchor);
      const value = daysBetween(start, end).reduce((s, d) => s + valueOn(logs, h.id, d), 0);
      return {
        key: dateKey(start),
        label: periodLabel('month', anchor)[0],
        detail: periodLabel('month', anchor),
        value,
        goal: habitProgress(h, logs, 'month', start, end)?.target ?? null,
      };
    });
  } else {
    const n = range === 'week' ? 7 : 30;
    bars = daysBetween(addDays(now, -(n - 1)), now).map((d, i) => ({
      key: dateKey(d),
      label: range === 'week' ? WEEKDAYS[weekdayIndex(d)][0] : (n - 1 - i) % 5 === 0 ? String(d.getDate()) : '',
      detail: shortDate(d),
      value: valueOn(logs, h.id, d),
      goal: isPerDay(h) && isDueOn(h, d) ? h.amount : null,
    }));
  }

  // Only draw a goal line when every bar shares the same goal.
  const goals = bars.map((b) => b.goal).filter((g): g is number => g !== null);
  const goalLine = goals.length && goals.every((g) => g === goals[0]) ? goals[0] : null;
  return { bars, goalLine };
}

// ── Weekday pattern ───────────────────────────────────────────────────────────

export interface WeekdayStat {
  /** Hit rate (0–1) for per-day habits, average amount otherwise. */
  value: number;
  /** Not a scheduled day for this habit. */
  off: boolean;
}

export function weekdayStats(h: Habit, logs: Logs, now: Date): { mode: 'rate' | 'avg'; days: WeekdayStat[] } {
  const all = daysBetween(parseKey(h.createdAt), now);
  const perDay = isPerDay(h);
  const days = WEEKDAYS.map((_, wd) => {
    const off = perDay && !!h.days?.length && !h.days.includes(wd);
    const of = all.filter((d) => weekdayIndex(d) === wd);
    if (perDay) {
      // Today only counts once it's done.
      const due = of.filter((d) => isDueOn(h, d) && (dateKey(d) !== dateKey(now) || valueOn(logs, h.id, d) >= h.amount));
      const met = due.filter((d) => valueOn(logs, h.id, d) >= h.amount).length;
      return { value: due.length ? met / due.length : 0, off };
    }
    const sum = of.reduce((s, d) => s + valueOn(logs, h.id, d), 0);
    return { value: of.length ? sum / of.length : 0, off };
  });
  return { mode: perDay ? 'rate' : 'avg', days };
}

// ── Records ───────────────────────────────────────────────────────────────────

export interface Best {
  value: number;
  label: string;
}

export function records(h: Habit, logs: Logs): { day: Best | null; week: Best | null; month: Best | null } {
  const entries = Object.entries(logs[h.id] ?? {}).filter(([, v]) => v > 0);
  if (!entries.length) return { day: null, week: null, month: null };

  const best = (kind: PeriodKind): Best => {
    const sums = new Map<string, { value: number; date: Date }>();
    for (const [key, v] of entries) {
      const d = parseKey(key);
      const pk = periodKey(kind, d);
      const cur = sums.get(pk);
      sums.set(pk, { value: (cur?.value ?? 0) + v, date: cur?.date ?? d });
    }
    let top = { value: 0, date: new Date() };
    for (const s of sums.values()) if (s.value > top.value) top = s;
    return { value: top.value, label: kind === 'day' ? shortDate(top.date) : periodLabel(kind, top.date) };
  };

  return { day: best('day'), week: best('week'), month: best('month') };
}

// ── Milestones ────────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  value: string;
  caption: string;
  earned: boolean;
}

const STREAK_STEPS: Record<PeriodKind, number[]> = {
  day: [3, 7, 30, 100],
  week: [2, 4, 12, 52],
  month: [2, 3, 6, 12],
};

const TOTAL_STEPS: Record<Unit, number[]> = {
  minutes: [60, 600, 3000, 6000],
  hours: [10, 50, 100, 500],
  times: [10, 50, 100, 500],
};

export function badges(h: Habit, bestStreak: number, total: number, daysLogged: number): Badge[] {
  const kind = streakKind(h);
  return [
    ...STREAK_STEPS[kind].map((n) => ({
      id: `streak-${n}`,
      value: String(n),
      caption: `${KIND_NOUN[kind][1].slice(0, -1)} streak`,
      earned: bestStreak >= n,
    })),
    ...[1, 10, 50, 100].map((n) => ({
      id: `logs-${n}`,
      value: String(n),
      caption: n === 1 ? 'first log' : 'days logged',
      earned: daysLogged >= n,
    })),
    ...TOTAL_STEPS[h.unit].map((n) => ({
      id: `total-${n}`,
      value: formatAmount(h.unit, n),
      caption: 'in total',
      earned: total >= n,
    })),
  ];
}
