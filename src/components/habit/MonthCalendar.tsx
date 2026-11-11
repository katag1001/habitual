import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dot } from '../Dot';
import { WEEKDAYS, dateKey, daysBetween, parseKey, periodLabel, periodRange, shiftPeriod, today, weekdayIndex } from '@/lib/dates';
import { Habit, Logs, cellState } from '@/lib/habits';
import { colors, fonts } from '@/theme';

interface Props {
  habit: Habit;
  logs: Logs;
  width: number;
  onPressDay: (date: Date) => void;
}

/** Month of dots, one per day; tap a past day to log it. */
export function MonthCalendar({ habit, logs, width, onPressDay }: Props) {
  const now = today();
  const [anchor, setAnchor] = useState(() => periodRange('month', now).start);
  const { start, end } = periodRange('month', anchor);
  const firstMonth = periodRange('month', parseKey(habit.createdAt)).start;
  const canBack = start > firstMonth;
  const canForward = end < now;

  const colW = width / 7;
  const dotSize = Math.min(30, colW - 12);
  const todayKey = dateKey(now);

  const cells: (Date | null)[] = [...Array(weekdayIndex(start)).fill(null), ...daysBetween(start, end)];
  while (cells.length % 7) cells.push(null);

  return (
    <View>
      <View style={styles.nav}>
        <Pressable onPress={() => setAnchor((a) => shiftPeriod('month', a, -1))} disabled={!canBack} hitSlop={12}>
          <Text style={[styles.arrow, !canBack && styles.faded]}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{periodLabel('month', anchor)}</Text>
        <Pressable onPress={() => setAnchor((a) => shiftPeriod('month', a, 1))} disabled={!canForward} hitSlop={12}>
          <Text style={[styles.arrow, !canForward && styles.faded]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.weekday, { width: colW }]}>
            {d[0]}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`blank-${i}`} style={{ width: colW, height: dotSize + 22 }} />;
          const c = cellState(habit, logs, d, now);
          const isToday = dateKey(d) === todayKey;
          return (
            <View key={dateKey(d)} style={[styles.cell, { width: colW, height: dotSize + 22 }]}>
              <Dot size={dotSize} planned={c.planned} fill={c.fill} disabled={c.future} onPress={() => onPressDay(d)} />
              <Text style={[styles.num, isToday && styles.numToday]}>{d.getDate()}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  arrow: { fontFamily: fonts.bold, fontSize: 26, color: colors.red, lineHeight: 30, paddingHorizontal: 6 },
  faded: { opacity: 0.25 },
  month: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  row: { flexDirection: 'row' },
  weekday: { fontFamily: fonts.bold, fontSize: 11, color: colors.red, textAlign: 'center', marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: fonts.body, fontSize: 10, color: colors.textSoft, marginTop: 2 },
  numToday: { fontFamily: fonts.bold, color: colors.red },
});
