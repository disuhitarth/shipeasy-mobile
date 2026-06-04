import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { PinPad } from '@/components/ui/PinPad';
import { colors, borderRadius, spacing } from '@/lib/theme';

interface PinSetupSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (pin: string) => void;
  title?: string;
}

type Stage = 'enter' | 'confirm';

export function PinSetupSheet({ visible, onClose, onComplete, title }: PinSetupSheetProps) {
  const [stage, setStage] = useState<Stage>('enter');
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const reset = useCallback(() => {
    setStage('enter');
    setFirst(null);
    setError(false);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFirst = useCallback((pin: string) => {
    setFirst(pin);
    setStage('confirm');
  }, []);

  const handleConfirm = useCallback(
    (pin: string) => {
      if (pin === first) {
        onComplete(pin);
        reset();
        return;
      }
      setError(true);
      setTimeout(() => {
        setError(false);
        setStage('enter');
        setFirst(null);
      }, 400);
    },
    [first, onComplete, reset],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabHandle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title ?? 'Set 4-digit PIN'}</Text>
            <TouchableOpacity onPress={close} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <PinPad
            onComplete={stage === 'enter' ? handleFirst : handleConfirm}
            error={error}
            subtitle={stage === 'enter' ? 'Choose 4 digits to unlock your wallet' : 'Re-enter the same PIN to confirm'}
            title={stage === 'enter' ? 'Create a PIN' : 'Confirm PIN'}
          />
          <Pressable onPress={close} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    minHeight: 540,
  },
  grabHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: spacing.md,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
});
