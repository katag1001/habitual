import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface Palette {
  bg: string;
  card: string;
  /** Main accent: buttons, fills, headings. */
  red: string;
  redDark: string;
  redShadow: string;
  /** Soft accent: inactive outlines, unmet bars. */
  pink: string;
  pinkFaint: string;
  text: string;
  textSoft: string;
  overlay: string;
  confetti: string[];
}

export interface Scheme {
  id: string;
  name: string;
  /** The two colours shown on the swatch in the picker. */
  swatch: [string, string];
  colors: Palette;
}

export const fonts = {
  display: 'Shrikhand_400Regular',
  body: 'Quicksand_500Medium',
  bold: 'Quicksand_700Bold',
};

// ── Colour maths ──

type RGB = [number, number, number];

const toRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = ([r, g, b]: RGB) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

/** Blend `a` towards `b` by `t` (0 = a, 1 = b). */
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as RGB);
};

const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Darken `fg` in small steps until it reaches `ratio` against `bg`. */
const ensureContrast = (fg: string, bg: string, ratio: number) => {
  let c = fg;
  for (let i = 0; i < 20 && contrast(c, bg) < ratio; i++) c = mix(c, '#000000', 0.08);
  return c;
};

/**
 * Builds a full palette from two colours. The lighter one becomes the background and the darker
 * one the accent; if both are the same, the background is a pale tint of it.
 */
function derive(a: string, b: string): Palette {
  let [bg, accent] = luminance(a) >= luminance(b) ? [a, b] : [b, a];
  if (bg.toLowerCase() === accent.toLowerCase()) bg = mix(accent, '#FFFFFF', 0.88);
  const red = ensureContrast(accent, bg, 3);
  const redDark = ensureContrast(mix(red, '#000000', 0.2), bg, 5.5);
  const [r, g, bl] = toRgb(mix(redDark, '#000000', 0.4));
  return {
    bg,
    card: mix(bg, '#FFFFFF', 0.5),
    red,
    redDark,
    redShadow: mix(red, bg, 0.65),
    pink: mix(red, bg, 0.7),
    pinkFaint: mix(red, bg, 0.82),
    text: redDark,
    textSoft: mix(red, bg, 0.35),
    overlay: `rgba(${r}, ${g}, ${bl}, 0.35)`,
    confetti: [red, accent, mix(red, '#FFFFFF', 0.4), bg, '#FFD27A', '#FFFFFF', redDark],
  };
}

export const SCHEMES: Scheme[] = [
  {
    id: 'strawberry',
    name: 'Strawberry',
    swatch: ['#FBE3E1', '#B8242C'],
    colors: {
      bg: '#FBE3E1',
      card: '#FDEFED',
      red: '#B8242C',
      redDark: '#8E1A21',
      redShadow: '#F0A9A9',
      pink: '#E9BDBB',
      pinkFaint: '#F3D3D1',
      text: '#8E1A21',
      textSoft: '#C77A7C',
      overlay: 'rgba(90, 20, 25, 0.35)',
      confetti: ['#B8242C', '#E35D6A', '#F4A3A8', '#FFD27A', '#FFFFFF', '#8E1A21'],
    },
  },
  { id: 'lagoon', name: 'Lagoon', swatch: ['#C3DEEF', '#007447'], colors: derive('#C3DEEF', '#007447') },
  { id: 'rhubarb', name: 'Rhubarb', swatch: ['#BAD797', '#670627'], colors: derive('#BAD797', '#670627') },
  { id: 'plum', name: 'Plum', swatch: ['#B5BEDD', '#470B24'], colors: derive('#470B24', '#B5BEDD') },
  { id: 'seaside', name: 'Seaside', swatch: ['#FEFACB', '#7B99B3'], colors: derive('#7B99B3', '#FEFACB') },
  { id: 'sunset', name: 'Sunset', swatch: ['#F89947', '#801735'], colors: derive('#801735', '#F89947') },
  { id: 'olive', name: 'Olive', swatch: ['#F2E7C7', '#9CA763'], colors: derive('#9CA763', '#F2E7C7') },
  { id: 'lilac', name: 'Lilac', swatch: ['#E0FEB4', '#BFA2DC'], colors: derive('#E0FEB4', '#BFA2DC') },
];

// ── Theme context ──

const STORAGE_KEY = 'habitual:scheme';

interface ThemeState {
  scheme: Scheme;
  setScheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeState>({ scheme: SCHEMES[0], setScheme: () => {} });

/** Loads the saved colour scheme before rendering children, so screens never flash the wrong colours. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [id, setId] = useState(SCHEMES[0].id);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && SCHEMES.some((s) => s.id === saved)) setId(saved);
      })
      .catch(console.warn)
      .finally(() => setReady(true));
  }, []);

  const setScheme = useCallback((next: string) => {
    setId(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(console.warn);
  }, []);

  const value = useMemo(() => ({ scheme: SCHEMES.find((s) => s.id === id) ?? SCHEMES[0], setScheme }), [id, setScheme]);

  if (!ready) return null;
  return createElement(ThemeContext.Provider, { value }, children);
}

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).scheme.colors;

/**
 * Turns a style factory into a hook that returns styles for the current scheme.
 * Each scheme's styles are built once and cached.
 */
export function makeStyles<R>(factory: (colors: Palette) => R): () => R {
  const cache = new Map<Palette, R>();
  return function useStyles() {
    const colors = useColors();
    let styles = cache.get(colors);
    if (!styles) {
      styles = factory(colors);
      cache.set(colors, styles);
    }
    return styles;
  };
}
