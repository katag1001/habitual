import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom popup card over a dimmed backdrop. */
export function Sheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: 20 + insets.bottom }]}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetButtons({
  onCancel,
  onSave,
  saveDisabled,
  saveLabel = 'Save',
}: {
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
}) {
  return (
    <View style={styles.buttons}>
      <Pressable onPress={onCancel} style={[styles.btn, styles.btnGhost]} hitSlop={6}>
        <Text style={[styles.btnText, { color: colors.red }]}>Cancel</Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={saveDisabled}
        style={[styles.btn, styles.btnSolid, saveDisabled && { opacity: 0.4 }]}
        hitSlop={6}
      >
        <Text style={[styles.btnText, { color: colors.card }]}>{saveLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { borderWidth: 1.5, borderColor: colors.red },
  btnSolid: { backgroundColor: colors.red },
  btnText: { fontFamily: fonts.bold, fontSize: 16 },
});
