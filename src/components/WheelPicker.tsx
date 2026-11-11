import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, fonts } from '@/theme';

const ITEM_H = 40;
const VISIBLE = 5; // must be odd
const PAD = (VISIBLE - 1) / 2;

interface Props {
  items: string[];
  index: number;
  onChange: (index: number) => void;
  width?: number;
}

/** A drum-style picker: items roll away and fade out towards the top and bottom. */
export function WheelPicker({ items, index, onChange, width = 90 }: Props) {
  const listRef = useRef<Animated.FlatList<string>>(null);
  const scrollY = useSharedValue(index * ITEM_H);
  const reported = useRef(index);

  // Two blank rows at each end so the first/last real item can sit in the centre.
  const data = [...Array(PAD).fill(''), ...items, ...Array(PAD).fill('')];

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const report = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, i));
      if (clamped !== reported.current) {
        reported.current = clamped;
        onChange(clamped);
      }
    },
    [items.length, onChange],
  );

  useAnimatedReaction(
    () => Math.round(scrollY.value / ITEM_H),
    (cur, prev) => {
      if (cur !== prev) scheduleOnRN(report, cur);
    },
  );

  // Follow external changes (e.g. the parent clamping a value).
  useEffect(() => {
    if (index !== reported.current) {
      reported.current = index;
      listRef.current?.scrollToOffset({ offset: index * ITEM_H, animated: true });
    }
  }, [index]);

  return (
    <View style={{ width, height: ITEM_H * VISIBLE }}>
      <View pointerEvents="none" style={styles.band} />
      <Animated.FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index: i }) => (
          <WheelItem label={item} position={i - PAD} scrollY={scrollY} />
        )}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        initialScrollIndex={index}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        windowSize={7}
      />
    </View>
  );
}

function WheelItem({ label, position, scrollY }: { label: string; position: number; scrollY: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = (scrollY.value - position * ITEM_H) / ITEM_H; // >0 above centre, <0 below
    const abs = Math.abs(d);
    return {
      opacity: interpolate(abs, [0, 1, 2, 2.6], [1, 0.55, 0.18, 0], Extrapolation.CLAMP),
      transform: [
        { perspective: 300 },
        { rotateX: `${interpolate(d, [-3, 3], [-75, 75], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(abs, [0, 2], [1, 0.82], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.item, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: ITEM_H * PAD,
    height: ITEM_H,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.red,
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 20, color: colors.red },
});
