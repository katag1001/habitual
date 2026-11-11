import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Sheet, SheetButtons } from './Sheet';
import { WheelPicker } from './WheelPicker';
import { dateKey, shortDate } from '@/lib/dates';
import { Habit, describeHabit, logDefault, logMax, unitLabel } from '@/lib/habits';
import { useHabits } from '@/store/HabitsContext';
import { colors, fonts } from '@/theme';

export interface LogTarget {
  habit: Habit;
  date: Date;
}

interface Props {
  target: LogTarget | null;
  onClose: () => void;
  onCelebrate: () => void;
}

/** Popup for entering how much of a habit was done on a given day. */
export function LogAmountSheet({ target, onClose, onCelebrate }: Props) {
  return (
    <Sheet visible={!!target} onClose={onClose}>
      {target && (
        <LogBody
          key={`${target.habit.id}:${dateKey(target.date)}`}
          {...target}
          onClose={onClose}
          onCelebrate={onCelebrate}
        />
      )}
    </Sheet>
  );
}

function LogBody({ habit, date, onClose, onCelebrate }: LogTarget & Omit<Props, 'target'>) {
  const { logs, setLog } = useHabits();
  const [value, setValue] = useState(() => logDefault(habit, logs, date));
  const items = Array.from({ length: logMax(habit) + 1 }, (_, i) => String(i));

  const save = () => {
    const celebrate = setLog(habit.id, date, value);
    onClose();
    if (celebrate) onCelebrate();
  };

  return (
    <>
      <Text style={styles.title} numberOfLines={1}>
        {habit.name}
      </Text>
      <Text style={styles.sub}>
        {shortDate(date)} · goal {describeHabit(habit)}
      </Text>
      <View style={styles.row}>
        <WheelPicker items={items} index={Math.min(value, items.length - 1)} onChange={setValue} width={80} />
        <Text style={styles.unit}>{unitLabel(habit.unit, value)}</Text>
      </View>
      <SheetButtons onCancel={onClose} onSave={save} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.red },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSoft, marginTop: 2, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  unit: { fontFamily: fonts.bold, fontSize: 18, color: colors.red, width: 90 },
});
