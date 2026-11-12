import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/lib/stats';
import { fonts, makeStyles, useColors } from '@/theme';

/** Grid of milestone circles: solid red when earned, faint outline when not. */
export function Badges({ items, width }: { items: Badge[]; width: number }) {
  const styles = useStyles();
  const colors = useColors();
  const perRow = 4;
  const gap = 10;
  const size = Math.min(64, (width - gap * (perRow - 1)) / perRow);

  return (
    <View style={[styles.grid, { gap }]}>
      {items.map((b) => (
        <View key={b.id} style={{ width: (width - gap * (perRow - 1)) / perRow, alignItems: 'center' }}>
          <View
            style={[
              styles.circle,
              { width: size, height: size, borderRadius: size / 2 },
              b.earned ? styles.earned : styles.locked,
            ]}
          >
            <Text
              style={[styles.value, { color: b.earned ? colors.card : colors.pink }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {b.value}
            </Text>
          </View>
          <Text style={[styles.caption, !b.earned && { opacity: 0.6 }]} numberOfLines={1}>
            {b.caption}
          </Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
    circle: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    earned: { backgroundColor: colors.red },
    locked: { borderWidth: 1.5, borderColor: colors.pink, borderStyle: 'dashed' },
    value: { fontFamily: fonts.display, fontSize: 18 },
    caption: { fontFamily: fonts.bold, fontSize: 10, color: colors.textSoft, marginTop: 4 },
  }),
);
