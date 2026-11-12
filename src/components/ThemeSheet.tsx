import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from './Sheet';
import { SCHEMES, fonts, makeStyles, useTheme } from '@/theme';

const PER_ROW = 4;

/** Popup for picking the app's colour scheme. Changes apply straight away so you can compare. */
export function ThemeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = useStyles();
  const { scheme, setScheme } = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Colour scheme</Text>
      <View style={styles.grid}>
        {SCHEMES.map((s) => {
          const on = s.id === scheme.id;
          return (
            <Pressable
              key={s.id}
              style={styles.option}
              onPress={() => setScheme(s.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${s.name} colour scheme`}
            >
              <View style={[styles.ring, on && styles.ringOn]}>
                <View style={styles.swatch}>
                  <View style={{ flex: 1, backgroundColor: s.swatch[0] }} />
                  <View style={{ flex: 1, backgroundColor: s.swatch[1] }} />
                </View>
              </View>
              <Text style={[styles.name, on && styles.nameOn]} numberOfLines={1}>
                {s.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={onClose} style={styles.done} hitSlop={6}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </Sheet>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    title: { fontFamily: fonts.display, fontSize: 24, color: colors.red, marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
    option: { width: `${100 / PER_ROW}%`, alignItems: 'center' },
    ring: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2.5,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringOn: { borderColor: colors.red },
    swatch: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
      flexDirection: 'row',
      transform: [{ rotate: '-45deg' }],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0, 0, 0, 0.15)',
    },
    name: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSoft, marginTop: 4 },
    nameOn: { color: colors.red },
    done: {
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.red,
      marginTop: 24,
    },
    doneText: { fontFamily: fonts.bold, fontSize: 16, color: colors.card },
  }),
);
