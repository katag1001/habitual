import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Dot } from './Dot';
import { WEEKDAYS, dateKey, daysBetween, periodRange, today, weekdayIndex } from '@/lib/dates';
import { Habit, Logs, cellState } from '@/lib/habits';
import { colors, fonts } from '@/theme';

const NAME_W = 108;
const ROW_H = 52;
const HEADER_H = 44;
const MONTH_COL_W = 42;
const H_PAD = 20;

interface Props {
  kind: 'week' | 'month';
  anchor: Date;
  habits: Habit[];
  logs: Logs;
  onPressCell: (habit: Habit, date: Date) => void;
}

export function HabitGrid({ kind, anchor, habits, logs, onPressCell }: Props) {
  const { width } = useWindowDimensions();
  const now = today();
  const todayKey = dateKey(now);
  const { start, end } = periodRange(kind, anchor);
  const days = daysBetween(start, end);

  const colW = kind === 'week' ? (width - H_PAD * 2 - NAME_W) / 7 : MONTH_COL_W;
  const dotSize = Math.min(32, colW - 8);

  const hScroll = useRef<ScrollViewInstance>(null);
  const monthKey = dateKey(start);
  useEffect(() => {
    if (kind !== 'month') return;
    // Open the month scrolled so today (or the 1st, for past months) is near the left.
    const idx = days.findIndex((d) => dateKey(d) === todayKey);
    const x = Math.max(0, (idx - 2) * MONTH_COL_W);
    setTimeout(() => hScroll.current?.scrollTo({ x, animated: false }), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, monthKey]);

  const names = (
    <View style={{ width: NAME_W }}>
      <View style={{ height: HEADER_H }} />
      {habits.map((h) => (
        <Pressable key={h.id} style={styles.nameCell} onPress={() => router.push(`/habit/${h.id}`)}>
          <Text style={styles.name} numberOfLines={2}>
            {h.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const columns = days.map((d) => {
    const key = dateKey(d);
    const isToday = key === todayKey;
    return (
      <View key={key} style={{ width: colW, alignItems: 'center' }}>
        <View style={[styles.headCell, isToday && styles.headToday]}>
          <Text style={[styles.headDay, isToday && styles.headTextToday]}>
            {kind === 'week' ? WEEKDAYS[weekdayIndex(d)] : WEEKDAYS[weekdayIndex(d)][0]}
          </Text>
          <Text style={[styles.headNum, isToday && styles.headTextToday]}>{d.getDate()}</Text>
        </View>
        {habits.map((h) => {
          const c = cellState(h, logs, d, now);
          return (
            <View key={h.id} style={styles.cell}>
              <Dot
                size={dotSize}
                planned={c.planned}
                fill={c.fill}
                disabled={c.future}
                onPress={() => onPressCell(h, d)}
              />
            </View>
          );
        })}
      </View>
    );
  });

  return (
    <View style={styles.grid}>
      {names}
      {kind === 'week' ? (
        <View style={{ flexDirection: 'row' }}>{columns}</View>
      ) : (
        <ScrollView ref={hScroll} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {columns}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', paddingHorizontal: H_PAD },
  nameCell: {
    height: ROW_H,
    justifyContent: 'center',
    paddingRight: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.pink,
  },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, textDecorationLine: 'underline', textDecorationColor: colors.pink },
  headCell: { height: HEADER_H - 6, width: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  headToday: { backgroundColor: colors.red },
  headDay: { fontFamily: fonts.bold, fontSize: 12, color: colors.red, textTransform: 'uppercase' },
  headNum: { fontFamily: fonts.body, fontSize: 11, color: colors.textSoft },
  headTextToday: { color: colors.card },
  cell: {
    height: ROW_H,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.pink,
  },
});
