import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddHabitSheet } from '@/components/AddHabitSheet';
import { Confetti, ConfettiBurst, createBurst } from '@/components/Confetti';
import { Badges } from '@/components/habit/Badges';
import { BarChart } from '@/components/habit/BarChart';
import { MonthCalendar } from '@/components/habit/MonthCalendar';
import { ProgressRing } from '@/components/habit/ProgressRing';
import { Caption, Section } from '@/components/habit/Section';
import { WeekdayChart } from '@/components/habit/WeekdayChart';
import { LogAmountSheet, LogTarget } from '@/components/LogAmountSheet';
import { Sheet } from '@/components/Sheet';
import { Tab, TabSwitch } from '@/components/TabSwitch';
import { WEEKDAYS, today } from '@/lib/dates';
import { Habit, describeHabit, isDueOn, isPerDay, ownPeriodProgress, unitLabel } from '@/lib/habits';
import {
  ChartRange,
  KIND_NOUN,
  badges,
  barSeries,
  completionRate,
  formatAmount,
  periodHistory,
  records,
  streakKind,
  streaks,
  totals,
  weekdayStats,
} from '@/lib/stats';
import { useHabits } from '@/store/HabitsContext';
import { colors, fonts } from '@/theme';

const H_PAD = 20;
const CARD_PAD = 16;
/** Let one modal finish closing before opening the next (iOS drops overlapping presents). */
const MODAL_GAP = 350;

const RANGE_TABS: Tab<ChartRange>[] = [
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
  { key: 'year', label: '12 months' },
];

const PERIOD_WORD = { day: 'today', week: 'this week', month: 'this month' } as const;

export default function HabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { habits } = useHabits();
  const habit = habits.find((h) => h.id === id);

  if (!habit) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingHorizontal: H_PAD }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ back</Text>
        </Pressable>
        <Text style={styles.sub}>Habit not found.</Text>
      </View>
    );
  }
  return <HabitDetail habit={habit} />;
}

function HabitDetail({ habit }: { habit: Habit }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { logs, updateHabit, deleteHabit } = useHabits();
  const [range, setRange] = useState<ChartRange>('week');
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null);
  const [burst, setBurst] = useState<ConfettiBurst | null>(null);

  const now = today();
  const inner = width - H_PAD * 2 - CARD_PAD * 2 - 3;
  const kind = streakKind(habit);

  // ── Derived stats ──
  const history = useMemo(() => periodHistory(habit, logs, today()), [habit, logs]);
  const { current, best } = useMemo(() => streaks(history), [history]);
  const rate = useMemo(() => completionRate(history), [history]);
  const { total, daysLogged } = useMemo(() => totals(habit, logs), [habit, logs]);
  const chart = useMemo(() => barSeries(habit, logs, range, today()), [habit, logs, range]);
  const weekday = useMemo(() => weekdayStats(habit, logs, today()), [habit, logs]);
  const best3 = useMemo(() => records(habit, logs), [habit, logs]);
  const badgeList = useMemo(() => badges(habit, best, total, daysLogged), [habit, best, total, daysLogged]);

  // Confetti when a milestone unlocks while you're on this page.
  const earned = badgeList.filter((b) => b.earned).length;
  const prevEarned = useRef(earned);
  useEffect(() => {
    if (earned > prevEarned.current) setBurst(createBurst());
    prevEarned.current = earned;
  }, [earned]);

  // ── Hero ring ──
  const { done, target } = ownPeriodProgress(habit, logs, now);
  const restDay = isPerDay(habit) && !isDueOn(habit, now);
  const periodWord = PERIOD_WORD[isPerDay(habit) ? 'day' : habit.period];
  let status: string;
  if (restDay) status = done ? 'bonus round — not scheduled today' : 'rest day — not scheduled today';
  else if (done >= target) status = `done ${periodWord}!`;
  else status = `${target - done} ${unitLabel(habit.unit, target - done)} to go ${periodWord}`;

  // ── Captions ──
  const chartTotal = chart.bars.reduce((s, b) => s + b.value, 0);
  const avgDivisor = range === 'year' ? 12 : chart.bars.length;
  const chartSummary = `${formatAmount(habit.unit, chartTotal)} total · avg ${formatAmount(habit.unit, chartTotal / avgDivisor)} per ${range === 'year' ? 'month' : 'day'}`;

  const scheduled = weekday.days.map((d, i) => ({ ...d, i })).filter((d) => !d.off);
  const strongest = scheduled.reduce((a, b) => (b.value > a.value ? b : a), scheduled[0]);
  const weakest = scheduled.reduce((a, b) => (b.value < a.value ? b : a), scheduled[0]);
  const weekdayCaption =
    !strongest || strongest.value === 0
      ? 'log a few days to see your pattern'
      : strongest.i === weakest.i || strongest.value === weakest.value
        ? 'nice and even across the week'
        : `strongest on ${WEEKDAYS[strongest.i]}s, quietest on ${WEEKDAYS[weakest.i]}s`;

  const streakNoun = (n: number) => KIND_NOUN[kind][n === 1 ? 0 : 1];

  // ── Actions ──
  const openLog = (date: Date) => {
    if (date <= now) setLogTarget({ habit, date });
  };

  const confirmDelete = () => {
    setMenuOpen(false);
    setTimeout(
      () =>
        Alert.alert('Delete habit?', `"${habit.name}" and all its history will be removed.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              router.back();
              deleteHabit(habit.id);
            },
          },
        ]),
      MODAL_GAP,
    );
  };

  const toggleArchive = () => {
    setMenuOpen(false);
    updateHabit(habit.id, { archived: !habit.archived });
    if (!habit.archived) router.back();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ back</Text>
        </Pressable>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} style={styles.menuBtn} accessibilityLabel="Habit options">
          <Text style={styles.menuDots}>•••</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{habit.name}</Text>
        <Text style={styles.sub}>
          {describeHabit(habit)}
          {habit.archived ? '  ·  archived' : ''}
        </Text>

        {/* Hero ring */}
        <Pressable style={styles.hero} onPress={() => openLog(now)}>
          <ProgressRing size={170} stroke={14} progress={target ? done / target : 0}>
            <Text style={styles.ringBig}>{done}</Text>
            <Text style={styles.ringSmall}>
              of {target} {unitLabel(habit.unit, target, true)}
            </Text>
          </ProgressRing>
          <Text style={styles.status}>{status}</Text>
          <Text style={styles.tapHint}>tap to log today</Text>
        </Pressable>

        {/* Stat tiles */}
        <View style={styles.tiles}>
          <Tile big={`🔥 ${current}`} small={`${streakNoun(current)} streak`} strong />
          <Tile big={String(best)} small={`best (${streakNoun(best)})`} />
        </View>
        <View style={styles.tiles}>
          <Tile big={rate === null ? '–' : `${Math.round(rate * 100)}%`} small="goals hit" />
          <Tile big={formatAmount(habit.unit, total)} small="total logged" />
        </View>

        <Section title="Calendar">
          <MonthCalendar habit={habit} logs={logs} width={inner} onPressDay={openLog} />
        </Section>

        <Section title="History">
          <View style={{ marginBottom: 14 }}>
            <TabSwitch tabs={RANGE_TABS} value={range} onChange={setRange} small />
          </View>
          <BarChart
            key={range}
            bars={chart.bars}
            goalLine={chart.goalLine}
            unit={habit.unit}
            width={inner}
            summary={chartSummary}
          />
        </Section>

        <Section title={weekday.mode === 'rate' ? 'Hit rate by weekday' : 'Average by weekday'}>
          <WeekdayChart mode={weekday.mode} days={weekday.days} unit={habit.unit} />
          <Caption>{weekdayCaption}</Caption>
        </Section>

        <Section title="Personal records">
          <RecordRow label="Longest streak" value={`${best} ${streakNoun(best)}`} />
          <RecordRow label="Best day" value={best3.day && formatAmount(habit.unit, best3.day.value)} note={best3.day?.label} />
          <RecordRow label="Best week" value={best3.week && formatAmount(habit.unit, best3.week.value)} note={best3.week?.label} />
          <RecordRow
            label="Best month"
            value={best3.month && formatAmount(habit.unit, best3.month.value)}
            note={best3.month?.label}
            last
          />
        </Section>

        <Section title="Milestones" right={<Text style={styles.count}>{earned} / {badgeList.length}</Text>}>
          <Badges items={badgeList} width={inner} />
        </Section>
      </ScrollView>

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <Text style={styles.menuTitle} numberOfLines={1}>
          {habit.name}
        </Text>
        <Pressable
          style={[styles.menuItem, styles.menuSolid]}
          onPress={() => {
            setMenuOpen(false);
            setTimeout(() => setEditing(true), MODAL_GAP);
          }}
        >
          <Text style={[styles.menuText, { color: colors.card }]}>Edit habit</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={toggleArchive}>
          <Text style={styles.menuText}>{habit.archived ? 'Unarchive' : 'Archive'}</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} style={styles.deleteBtn} hitSlop={8}>
          <Text style={styles.deleteText}>Delete habit</Text>
        </Pressable>
      </Sheet>

      <AddHabitSheet
        visible={editing}
        initial={habit}
        onClose={() => setEditing(false)}
        onSave={(changes) => updateHabit(habit.id, changes)}
      />
      <LogAmountSheet target={logTarget} onClose={() => setLogTarget(null)} onCelebrate={() => setBurst(createBurst())} />
      <Confetti burst={burst} />
    </View>
  );
}

function Tile({ big, small, strong }: { big: string; small: string; strong?: boolean }) {
  return (
    <View style={[styles.tile, strong && { borderColor: colors.red }]}>
      <Text style={styles.tileBig} numberOfLines={1} adjustsFontSizeToFit>
        {big}
      </Text>
      <Text style={styles.tileSmall}>{small}</Text>
    </View>
  );
}

function RecordRow({ label, value, note, last }: { label: string; value: string | null; note?: string; last?: boolean }) {
  return (
    <View style={[styles.record, !last && styles.recordBorder]}>
      <Text style={styles.recordLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.recordValue}>{value ?? '–'}</Text>
        {note && <Text style={styles.recordNote}>{note}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: H_PAD },
  back: { fontFamily: fonts.bold, fontSize: 16, color: colors.red },
  menuBtn: { paddingVertical: 4 },
  menuDots: { fontFamily: fonts.bold, fontSize: 16, color: colors.red, letterSpacing: 2 },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.red,
    marginTop: 12,
    textShadowColor: colors.redShadow,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 1,
  },
  sub: { fontFamily: fonts.bold, fontSize: 16, color: colors.textSoft, marginTop: 2 },

  hero: { alignItems: 'center', marginTop: 24 },
  ringBig: { fontFamily: fonts.display, fontSize: 40, color: colors.red, lineHeight: 50 },
  ringSmall: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSoft, marginTop: -4 },
  status: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 14 },
  tapHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft, marginTop: 2 },

  tiles: { flexDirection: 'row', gap: 12, marginTop: 12 },
  tile: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.pink,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tileBig: { fontFamily: fonts.display, fontSize: 26, color: colors.red },
  tileSmall: { fontFamily: fonts.bold, fontSize: 11, color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 1 },

  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.textSoft, textAlign: 'center', paddingVertical: 20 },
  count: { fontFamily: fonts.bold, fontSize: 12, color: colors.red },

  record: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  recordBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.pink },
  recordLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  recordValue: { fontFamily: fonts.display, fontSize: 18, color: colors.red },
  recordNote: { fontFamily: fonts.body, fontSize: 11, color: colors.textSoft },

  menuTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.red, marginBottom: 16 },
  menuItem: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuSolid: { backgroundColor: colors.red },
  menuText: { fontFamily: fonts.bold, fontSize: 16, color: colors.red },
  deleteBtn: { alignSelf: 'center', padding: 10, marginTop: 4 },
  deleteText: { fontFamily: fonts.bold, fontSize: 15, color: colors.red, textDecorationLine: 'underline' },
});
