import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, makeStyles } from '@/theme';

/** Bordered card with a small uppercase heading, matching the home-screen stat boxes. */
export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <Text style={styles.caption}>{children}</Text>;
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      borderWidth: 1.5,
      borderColor: colors.pink,
      borderRadius: 20,
      padding: 16,
      marginTop: 16,
    },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    title: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 1 },
    caption: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginTop: 12 },
  }),
);
