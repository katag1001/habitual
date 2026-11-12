import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/theme';

const COUNT = 70;
const DURATION = 2800;
const GRAVITY = 2.6;

interface Piece {
  x0: number;
  vx: number;
  vy: number;
  spin: number;
  w: number;
  h: number;
  /** 0–1, picks a colour from the current scheme's confetti list. */
  hue: number;
}

export interface ConfettiBurst {
  id: number;
  pieces: Piece[];
}

/** Call from an event handler; pass the result to <Confetti /> to fire it. */
export function createBurst(): ConfettiBurst {
  return {
    id: Date.now(),
    pieces: Array.from({ length: COUNT }, () => ({
      x0: Math.random(),
      vx: (Math.random() - 0.5) * 0.6,
      vy: 1.3 + Math.random() * 0.8,
      spin: (Math.random() - 0.5) * 1440,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      hue: Math.random(),
    })),
  };
}

/** Confetti that shoots up from the bottom of the screen and falls back down. */
export function Confetti({ burst }: { burst: ConfettiBurst | null }) {
  const t = useSharedValue(1);

  useEffect(() => {
    if (!burst) return;
    t.value = 0;
    t.value = withTiming(1, { duration: DURATION, easing: Easing.linear });
  }, [burst, t]);

  if (!burst) return null;
  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {burst.pieces.map((p, i) => (
        <ConfettiPiece key={`${burst.id}-${i}`} piece={p} t={t} />
      ))}
    </Animated.View>
  );
}

function ConfettiPiece({ piece, t }: { piece: Piece; t: SharedValue<number> }) {
  const { width, height } = useWindowDimensions();
  const palette = useColors().confetti;
  const color = palette[Math.floor(piece.hue * palette.length)];

  const style = useAnimatedStyle(() => {
    const s = t.value;
    const rise = piece.vy * s - 0.5 * GRAVITY * s * s; // fraction of screen height above the bottom
    return {
      opacity: s >= 1 ? 0 : s > 0.8 ? (1 - s) / 0.2 : 1,
      transform: [
        { translateX: (piece.x0 + piece.vx * s) * width },
        { translateY: height + 20 - rise * height },
        { rotate: `${piece.spin * s}deg` },
        { rotateX: `${piece.spin * 0.7 * s}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width: piece.w, height: piece.h, backgroundColor: color, borderRadius: 2 },
        style,
      ]}
    />
  );
}
