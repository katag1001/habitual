import { ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useColors } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size: number;
  stroke: number;
  progress: number; // 0–1
  children?: ReactNode;
}

export function ProgressRing({ size, stroke, progress, children }: Props) {
  const colors = useColors();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const level = useSharedValue(0);

  useEffect(() => {
    level.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 700 });
  }, [progress, level]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - level.value),
    strokeOpacity: level.value > 0.002 ? 1 : 0,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.pinkFaint} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.red}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
