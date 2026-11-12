import { memo, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useColors } from '@/theme';

interface Props {
  size: number;
  planned: boolean;
  fill: number; // 0–1, fills from the bottom up
  disabled?: boolean;
  onPress?: () => void;
}

export const Dot = memo(function Dot({ size, planned, fill, disabled, onPress }: Props) {
  const styles = useStyles();
  const colors = useColors();
  const level = useSharedValue(fill);

  useEffect(() => {
    level.value = withTiming(fill, { duration: 350 });
  }, [fill, level]);

  const fillStyle = useAnimatedStyle(() => ({ height: `${level.value * 100}%` }));

  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={4}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: planned ? colors.red : colors.pink,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
      >
        <Animated.View style={[styles.fill, fillStyle]} />
      </Animated.View>
    </Pressable>
  );
});

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    dot: { borderWidth: 1.5, overflow: 'hidden', justifyContent: 'flex-end' },
    fill: { width: '100%', backgroundColor: colors.red },
  }),
);
