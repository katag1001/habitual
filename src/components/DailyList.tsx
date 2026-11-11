import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from './ProgressBar';
import { today } from '@/lib/dates';
import { Habit, Logs, isDueOn, isPerDay, ownPeriodProgress, unitLabel } from '@/lib/habits';
import { colors, fonts } from '@/theme';

interface Props {
  date: Date;
  habits: Habit[];
  logs: Logs;
  onPressHabit: (habit: Habit, date: Date) => void;
}

export function DailyList({ date, habits, logs, onPressHabit }: Props) {
  const future = date > today();

  return (
    <View style={styles.list}>
      {habits.map((h) => {
        const { done, target } = ownPeriodProgress(h, logs, date);
        const perDay = isPerDay(h);
        const due = perDay ? isDueOn(h, date) : done < target;
        let label = `${done} / ${target} ${unitLabel(h.unit, target, true)}`;
        if (!perDay) label += ` this ${h.period}`;
        else if (!isDueOn(h, date) && !done) label = 'not today';

        return (
          <View key={h.id} style={styles.row}>
            <View style={styles.top}>
              <Pressable onPress={() => router.push(`/habit/${h.id}`)} hitSlop={6} style={{ flexShrink: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {h.name}
                </Text>
              </Pressable>
              <Text style={styles.label}>{label}</Text>
            </View>
            <Pressable onPress={() => onPressHabit(h, date)} disabled={future} style={future && { opacity: 0.45 }}>
              <ProgressBar progress={target ? done / target : 0} planned={due || done > 0} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 18, paddingTop: 4 },
  row: { gap: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, textDecorationLine: 'underline', textDecorationColor: colors.pink },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.textSoft },
});
