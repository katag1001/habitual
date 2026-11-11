import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { PeriodKind, dateKey, periodKey, today } from '@/lib/dates';
import { Habit, Logs, periodPercent } from '@/lib/habits';

const KEYS = {
  habits: 'habitual:habits',
  logs: 'habitual:logs',
  celebrated: 'habitual:celebrated',
};

interface HabitsState {
  ready: boolean;
  habits: Habit[];
  logs: Logs;
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, changes: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  deleteHabit: (id: string) => void;
  /** Sets the amount for a day. Returns true if this completed a day/week/month for the first time. */
  setLog: (habitId: string, date: Date, value: number) => boolean;
}

const HabitsContext = createContext<HabitsState | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Logs>({});
  const celebrated = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [h, l, c] = await Promise.all([
          AsyncStorage.getItem(KEYS.habits),
          AsyncStorage.getItem(KEYS.logs),
          AsyncStorage.getItem(KEYS.celebrated),
        ]);
        if (h) setHabits(JSON.parse(h));
        if (l) setLogs(JSON.parse(l));
        if (c) celebrated.current = new Set(JSON.parse(c));
      } catch (e) {
        console.warn('Failed to load habits', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEYS.habits, JSON.stringify(habits)).catch(console.warn);
  }, [habits, ready]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEYS.logs, JSON.stringify(logs)).catch(console.warn);
  }, [logs, ready]);

  const addHabit = useCallback((h: Omit<Habit, 'id' | 'createdAt'>) => {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    setHabits((prev) => [...prev, { ...h, id, createdAt: dateKey(today()) }]);
  }, []);

  const updateHabit = useCallback((id: string, changes: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...changes } : h)));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const setLog = useCallback(
    (habitId: string, date: Date, value: number) => {
      const key = dateKey(date);
      const forHabit = { ...logs[habitId] };
      if (value > 0) forHabit[key] = value;
      else delete forHabit[key];
      const next = { ...logs, [habitId]: forHabit };
      setLogs(next);

      const active = habits.filter((h) => !h.archived);
      let celebrate = false;
      for (const kind of ['day', 'week', 'month'] as PeriodKind[]) {
        const pk = periodKey(kind, date);
        if (!celebrated.current.has(pk) && periodPercent(active, next, kind, date) === 100) {
          celebrated.current.add(pk);
          celebrate = true;
        }
      }
      if (celebrate) {
        AsyncStorage.setItem(KEYS.celebrated, JSON.stringify([...celebrated.current])).catch(console.warn);
      }
      return celebrate;
    },
    [habits, logs],
  );

  return (
    <HabitsContext.Provider value={{ ready, habits, logs, addHabit, updateHabit, deleteHabit, setLog }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits(): HabitsState {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used inside HabitsProvider');
  return ctx;
}
