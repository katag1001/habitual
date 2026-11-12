import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useColors } from '@/theme';

export function ProgressBar({ progress, planned }: { progress: number; planned: boolean }) {
  const styles = useStyles();
  const colors = useColors();
  const level = useSharedValue(progress);

  useEffect(() => {
    level.value = withTiming(Math.min(1, progress), { duration: 400 });
  }, [progress, level]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${level.value * 100}%` }));

  return (
    <View style={[styles.track, { borderColor: planned ? colors.red : colors.pink }]}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    track: { height: 18, borderRadius: 9, borderWidth: 1.5, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: colors.red, borderRadius: 9 },
  }),
);
