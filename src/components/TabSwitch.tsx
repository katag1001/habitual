import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PeriodKind } from '@/lib/dates';
import { colors, fonts } from '@/theme';

const TABS: { kind: PeriodKind; label: string }[] = [
  { kind: 'day', label: 'daily' },
  { kind: 'week', label: 'weekly' },
  { kind: 'month', label: 'monthly' },
];

export function TabSwitch({ value, onChange }: { value: PeriodKind; onChange: (k: PeriodKind) => void }) {
  const [width, setWidth] = useState(0);
  const index = TABS.findIndex((t) => t.kind === value);
  const x = useSharedValue(index);

  useEffect(() => {
    x.value = withTiming(index, { duration: 220 });
  }, [index, x]);

  const tabW = (width - 8) / TABS.length;
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * tabW }] }));

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && <Animated.View style={[styles.pill, { width: tabW }, pill]} />}
      {TABS.map((t) => (
        <Pressable key={t.kind} style={styles.tab} onPress={() => onChange(t.kind)}>
          <Text style={[styles.label, t.kind === value && { color: colors.card }]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.red,
    borderRadius: 22,
    padding: 3,
    height: 44,
  },
  pill: { position: 'absolute', top: 3, left: 3, bottom: 3, borderRadius: 18, backgroundColor: colors.red },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.red },
});
