import { StyleSheet, Text, View } from 'react-native';

import { WEEKDAYS } from '@/lib/dates';
import { Unit } from '@/lib/habits';
import { WeekdayStat, formatAmount } from '@/lib/stats';
import { colors, fonts } from '@/theme';

const TRACK_H = 90;

interface Props {
  mode: 'rate' | 'avg';
  days: WeekdayStat[];
  unit: Unit;
}

/** Seven columns, Mon–Sun; the strongest day is solid red. */
export function WeekdayChart({ mode, days, unit }: Props) {
  const max = mode === 'rate' ? 1 : Math.max(...days.map((d) => d.value), 0);
  const bestValue = Math.max(...days.filter((d) => !d.off).map((d) => d.value), 0);

  return (
    <View style={styles.row}>
      {days.map((d, i) => {
        const best = bestValue > 0 && d.value === bestValue && !d.off;
        const pct = max > 0 ? d.value / max : 0;
        return (
          <View key={WEEKDAYS[i]} style={[styles.col, d.off && { opacity: 0.35 }]}>
            <Text style={[styles.value, best && { color: colors.red }]} numberOfLines={1}>
              {d.off ? '–' : mode === 'rate' ? `${Math.round(d.value * 100)}%` : formatAmount(unit, d.value)}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { height: `${pct * 100}%`, backgroundColor: best ? colors.red : colors.pink },
                ]}
              />
            </View>
            <Text style={[styles.day, best && { color: colors.red }]}>{WEEKDAYS[i].slice(0, 2)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  col: { flex: 1, alignItems: 'center' },
  value: { fontFamily: fonts.bold, fontSize: 10, color: colors.textSoft, marginBottom: 4 },
  track: {
    width: '100%',
    maxWidth: 30,
    height: TRACK_H,
    borderRadius: 10,
    backgroundColor: colors.pinkFaint,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: { width: '100%', borderRadius: 10 },
  day: { fontFamily: fonts.bold, fontSize: 11, color: colors.textSoft, marginTop: 6, textTransform: 'uppercase' },
});
