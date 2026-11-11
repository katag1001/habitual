import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { Unit } from '@/lib/habits';
import { Bar, formatAmount } from '@/lib/stats';
import { colors, fonts } from '@/theme';

interface Props {
  bars: Bar[];
  goalLine: number | null;
  unit: Unit;
  width: number;
  height?: number;
  /** Shown when no bar is selected. */
  summary: string;
}

/** Bars for each day/month; met goals are solid red, short ones pink. Tap a bar for its value. */
export function BarChart({ bars, goalLine, unit, width, height = 140, summary }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const sel = bars.find((b) => b.key === selected);

  const top = Math.max(1, goalLine ?? 0, ...bars.map((b) => b.value)) * 1.15;
  const slot = width / bars.length;
  const barW = Math.max(3, slot * 0.62);
  const y = (v: number) => height - (v / top) * height;

  return (
    <View>
      <Text style={styles.readout}>
        {sel ? `${sel.detail} · ${formatAmount(unit, sel.value)}${sel.goal ? ` / ${formatAmount(unit, sel.goal)}` : ''}` : summary}
      </Text>

      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          <Line x1={0} x2={width} y1={height - 0.75} y2={height - 0.75} stroke={colors.pink} strokeWidth={1.5} />
          {bars.map((b, i) => {
            if (b.value <= 0) return null;
            const h = Math.max(3, height - y(b.value));
            const met = b.goal === null || b.value >= b.goal;
            return (
              <Rect
                key={b.key}
                x={i * slot + (slot - barW) / 2}
                y={height - h}
                width={barW}
                height={h}
                rx={Math.min(barW / 2, 5)}
                fill={met ? colors.red : colors.pink}
                opacity={sel && sel.key !== b.key ? 0.35 : 1}
              />
            );
          })}
          {goalLine !== null && (
            <Line
              x1={0}
              x2={width}
              y1={y(goalLine)}
              y2={y(goalLine)}
              stroke={colors.textSoft}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
          )}
        </Svg>
        {goalLine !== null && <Text style={[styles.goal, { top: y(goalLine) - 18 }]}>goal</Text>}
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.row}>
            {bars.map((b) => (
              <Pressable
                key={b.key}
                style={{ flex: 1 }}
                onPress={() => setSelected((s) => (s === b.key ? null : b.key))}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.row}>
        {bars.map((b) => (
          <Text key={b.key} style={[styles.label, sel?.key === b.key && styles.labelOn]} numberOfLines={1}>
            {b.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', flex: 1 },
  goal: { position: 'absolute', right: 0, fontFamily: fonts.bold, fontSize: 10, color: colors.textSoft },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textSoft,
    marginTop: 6,
    overflow: 'visible',
  },
  labelOn: { color: colors.red },
});
