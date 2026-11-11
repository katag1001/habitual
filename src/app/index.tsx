import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddHabitSheet } from '@/components/AddHabitSheet';
import { Confetti, ConfettiBurst, createBurst } from '@/components/Confetti';
import { DailyList } from '@/components/DailyList';
import { HabitGrid } from '@/components/HabitGrid';
import { LogAmountSheet, LogTarget } from '@/components/LogAmountSheet';
import { TabSwitch } from '@/components/TabSwitch';
import { PeriodKind, periodKey, periodLabel, shiftPeriod, today } from '@/lib/dates';
import { Habit, periodPercent, streak } from '@/lib/habits';
import { useHabits } from '@/store/HabitsContext';
import { colors, fonts } from '@/theme';

const STREAK_UNIT: Record<PeriodKind, [string, string]> = {
  day: ['day', 'days'],
  week: ['week', 'weeks'],
  month: ['month', 'months'],
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const { habits, logs, addHabit } = useHabits();
  const [kind, setKind] = useState<PeriodKind>('week');
  const [anchor, setAnchor] = useState(today);
  const [adding, setAdding] = useState(false);
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null);
  const [burst, setBurst] = useState<ConfettiBurst | null>(null);

  const now = today();
  const atCurrent = periodKey(kind, anchor) === periodKey(kind, now);
  const percent = useMemo(() => periodPercent(habits, logs, kind, anchor), [habits, logs, kind, anchor]);
  const streakCount = useMemo(() => streak(habits, logs, kind, today()), [habits, logs, kind]);

  const openLog = (habit: Habit, date: Date) => {
    if (date <= now) setLogTarget({ habit, date });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>You got this </Text>
        <Pressable style={styles.plus} onPress={() => setAdding(true)} hitSlop={8} accessibilityLabel="Add habit">
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statBig}>{percent === null ? '–' : `${percent}%`}</Text>
          <Text style={styles.statSmall}>{periodLabel(kind, anchor).toLowerCase()}</Text>
        </View>
        <View style={[styles.statBox, styles.streakBox]}>
          <Text style={styles.statBig}>🔥 {streakCount}</Text>
          <Text style={styles.statSmall}>
            {STREAK_UNIT[kind][streakCount === 1 ? 0 : 1]} streak
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TabSwitch value={kind} onChange={setKind} />
      </View>

      <View style={styles.nav}>
        <Pressable onPress={() => setAnchor((a) => shiftPeriod(kind, a, -1))} hitSlop={12} style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setAnchor(today())} disabled={atCurrent}>
          <Text style={styles.navLabel}>{periodLabel(kind, anchor)}</Text>
        </Pressable>
        <Pressable
          onPress={() => setAnchor((a) => shiftPeriod(kind, a, 1))}
          hitSlop={12}
          style={[styles.arrow, atCurrent && { opacity: 0.25 }]}
          disabled={atCurrent}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <Text style={styles.empty}>tap + to add your first habit</Text>
        ) : kind === 'day' ? (
          <DailyList date={anchor} habits={habits} logs={logs} onPressHabit={openLog} />
        ) : (
          <HabitGrid kind={kind} anchor={anchor} habits={habits} logs={logs} onPressCell={openLog} />
        )}
      </ScrollView>

      <AddHabitSheet visible={adding} onClose={() => setAdding(false)} onSave={addHabit} />
      <LogAmountSheet target={logTarget} onClose={() => setLogTarget(null)} onCelebrate={() => setBurst(createBurst())} />
      <Confetti burst={burst} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.red,
    textShadowColor: colors.redShadow,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 1,
  },
  plus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { color: colors.card, fontSize: 28, lineHeight: 32, fontFamily: fonts.bold },
  stats: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 12 },
  statBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.red,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  streakBox: { borderColor: colors.pink },
  statBig: { fontFamily: fonts.display, fontSize: 26, color: colors.red },
  statSmall: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 1 },
  tabs: { paddingHorizontal: 20, marginTop: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginVertical: 12 },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontFamily: fonts.bold, fontSize: 30, color: colors.red, lineHeight: 34 },
  navLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  empty: { fontFamily: fonts.body, fontSize: 16, color: colors.textSoft, textAlign: 'center', marginTop: 60 },
});
