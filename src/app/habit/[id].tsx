import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeHabit } from '@/lib/habits';
import { useHabits } from '@/store/HabitsContext';
import { colors, fonts } from '@/theme';

/** Placeholder — full stats, edit and delete get designed next. */
export default function HabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { habits, deleteHabit } = useHabits();
  const habit = habits.find((h) => h.id === id);

  const confirmDelete = () =>
    Alert.alert('Delete habit?', `"${habit?.name}" and all its history will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteHabit(id);
        },
      },
    ]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ back</Text>
      </Pressable>
      {habit ? (
        <>
          <Text style={styles.title}>{habit.name}</Text>
          <Text style={styles.sub}>{describeHabit(habit)}</Text>
          <Text style={styles.soon}>stats coming soon</Text>
          <Pressable onPress={confirmDelete} style={styles.delete}>
            <Text style={styles.deleteText}>Delete habit</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.sub}>Habit not found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  back: { fontFamily: fonts.bold, fontSize: 16, color: colors.red },
  title: { fontFamily: fonts.display, fontSize: 36, color: colors.red, marginTop: 16 },
  sub: { fontFamily: fonts.bold, fontSize: 16, color: colors.textSoft, marginTop: 4 },
  soon: { fontFamily: fonts.body, fontSize: 15, color: colors.textSoft, marginTop: 40, textAlign: 'center' },
  delete: { marginTop: 'auto', marginBottom: 40, alignSelf: 'center', padding: 12 },
  deleteText: { fontFamily: fonts.bold, fontSize: 15, color: colors.red, textDecorationLine: 'underline' },
});
