import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputInstance, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Sheet, SheetButtons } from './Sheet';
import { WheelPicker } from './WheelPicker';
import { PeriodKind, WEEKDAYS } from '@/lib/dates';
import { Habit, Unit, describeHabit, unitLabel } from '@/lib/habits';
import { colors, fonts } from '@/theme';

const UNITS: Unit[] = ['minutes', 'hours', 'times'];
const PERIODS: PeriodKind[] = ['day', 'week', 'month'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (h: Omit<Habit, 'id' | 'createdAt'>) => void;
  /** When set, the sheet edits this habit instead of creating a new one. */
  initial?: Habit;
}

export function AddHabitSheet({ visible, onClose, onSave, initial }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {visible && <AddHabitBody onClose={onClose} onSave={onSave} initial={initial} />}
    </Sheet>
  );
}

function AddHabitBody({ onClose, onSave, initial }: Omit<Props, 'visible'>) {
  const [name, setName] = useState(initial?.name ?? '');
  const [rawAmount, setAmount] = useState(initial?.amount ?? 1);
  const [unitIdx, setUnitIdx] = useState(initial ? UNITS.indexOf(initial.unit) : 2);
  const [periodIdx, setPeriodIdx] = useState(initial ? PERIODS.indexOf(initial.period) : 0);
  const [days, setDays] = useState<number[]>(initial?.days ?? []);

  const unit = UNITS[unitIdx];
  const period = PERIODS[periodIdx];
  const perDay = period === 'day' || (period === 'week' && days.length > 0);
  // Block combinations that don't make sense, like 30 hours a day.
  const maxAmount = unit === 'hours' && perDay ? 24 : 60;
  const amount = Math.min(rawAmount, maxAmount);

  const numbers = Array.from({ length: maxAmount }, (_, i) => String(i + 1));
  const units = UNITS.map((u) => unitLabel(u, amount));
  const habit = { amount, unit, period, days: period === 'week' && days.length ? days : undefined };

  const toggleDay = (i: number) =>
    setDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort()));

  const save = () => {
    onSave({ name: name.trim(), ...habit });
    onClose();
  };

  return (
    <>
      <NameInput value={name} onChange={setName} />

      <View style={styles.wheels}>
        <WheelPicker items={numbers} index={amount - 1} onChange={(i) => setAmount(i + 1)} width={64} />
        <WheelPicker items={units} index={unitIdx} onChange={setUnitIdx} width={104} />
        <Text style={styles.every}>every</Text>
        <WheelPicker items={PERIODS} index={periodIdx} onChange={setPeriodIdx} width={84} />
      </View>

      {period === 'week' && (
        <View style={styles.daysBlock}>
          <Text style={styles.hint}>on certain days? (optional)</Text>
          <View style={styles.days}>
            {WEEKDAYS.map((d, i) => {
              const on = days.includes(i);
              return (
                <Pressable key={d} onPress={() => toggleDay(i)} style={[styles.day, on && styles.dayOn]} hitSlop={4}>
                  <Text style={[styles.dayText, on && { color: colors.card }]}>{d.slice(0, 2)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Text style={styles.summary}>{describeHabit(habit)}</Text>

      <SheetButtons onCancel={onClose} onSave={save} saveDisabled={!name.trim()} />
    </>
  );
}

/** Borderless input: shows "habit name" with a blinking cursor; once focused only the real cursor remains. */
function NameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 })), -1);
  }, [blink]);

  const cursorStyle = useAnimatedStyle(() => ({ opacity: blink.value > 0.5 ? 1 : 0 }));
  const showPlaceholder = !focused && !value;

  return (
    <View style={styles.nameWrap}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.nameInput}
        cursorColor={colors.red}
        selectionColor={colors.red}
        maxLength={40}
        returnKeyType="done"
      />
      {showPlaceholder && (
        <Pressable style={styles.placeholder} onPress={() => ref.current?.focus()}>
          <Text style={styles.placeholderText}>habit name</Text>
          <Animated.View style={[styles.fakeCursor, cursorStyle]} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nameWrap: { height: 48, justifyContent: 'center', marginBottom: 12 },
  nameInput: { fontFamily: fonts.display, fontSize: 26, color: colors.red, padding: 0 },
  placeholder: { ...StyleSheet.absoluteFill, flexDirection: 'row', alignItems: 'center' },
  placeholderText: { fontFamily: fonts.display, fontSize: 26, color: colors.textSoft, opacity: 0.6 },
  fakeCursor: { width: 2, height: 28, backgroundColor: colors.red, marginLeft: 4 },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  every: { fontFamily: fonts.bold, fontSize: 16, color: colors.textSoft, marginHorizontal: 4 },
  daysBlock: { marginTop: 12 },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.textSoft, textAlign: 'center', marginBottom: 8 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: colors.red },
  dayText: { fontFamily: fonts.bold, fontSize: 13, color: colors.red },
  summary: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, textAlign: 'center', marginTop: 16 },
});
