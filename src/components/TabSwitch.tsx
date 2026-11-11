import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, fonts } from '@/theme';

export interface Tab<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (k: T) => void;
  small?: boolean;
}

export function TabSwitch<T extends string>({ tabs, value, onChange, small }: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = tabs.findIndex((t) => t.key === value);
  const x = useSharedValue(index);

  useEffect(() => {
    x.value = withTiming(index, { duration: 220 });
  }, [index, x]);

  const tabW = (width - 8) / tabs.length;
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * tabW }] }));

  return (
    <View style={[styles.wrap, small && styles.wrapSmall]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && <Animated.View style={[styles.pill, small && styles.pillSmall, { width: tabW }, pill]} />}
      {tabs.map((t) => (
        <Pressable key={t.key} style={styles.tab} onPress={() => onChange(t.key)}>
          <Text style={[styles.label, small && styles.labelSmall, t.key === value && { color: colors.card }]}>
            {t.label}
          </Text>
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
  wrapSmall: { height: 34, borderRadius: 17 },
  pill: { position: 'absolute', top: 3, left: 3, bottom: 3, borderRadius: 18, backgroundColor: colors.red },
  pillSmall: { borderRadius: 13 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.red },
  labelSmall: { fontSize: 13 },
});
