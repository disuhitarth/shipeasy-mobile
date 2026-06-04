import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { colors, borderRadius, spacing } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

interface PinPadProps {
  length?: number;
  onComplete: (pin: string) => void;
  onChange?: (pin: string) => void;
  error?: boolean;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
}

export function PinPad({
  length = 4,
  onComplete,
  onChange,
  error,
  title,
  subtitle,
  disabled,
}: PinPadProps) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (error && pin.length > 0) {
      const t = setTimeout(() => setPin(''), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [error, pin.length]);

  const press = useCallback(
    (d: string) => {
      if (disabled) return;
      if (d === 'back') {
        setPin((p) => {
          const np = p.slice(0, -1);
          onChange?.(np);
          Haptics.selection();
          return np;
        });
        return;
      }
      if (d === '') return;
      setPin((p) => {
        if (p.length >= length) return p;
        const np = p + d;
        onChange?.(np);
        Haptics.selection();
        if (np.length === length) {
          setTimeout(() => onComplete(np), 60);
        }
        return np;
      });
    },
    [disabled, length, onChange, onComplete],
  );

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < pin.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                filled && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.pad}>
        {DIGITS.map((d, i) => {
          if (d === '') return <View key={`spacer-${i}`} style={styles.keySpacer} />;
          if (d === 'back') {
            return (
              <Pressable
                key={`back-${i}`}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                onPress={() => press('back')}
                disabled={disabled || pin.length === 0}
              >
                <Ionicons
                  name="backspace-outline"
                  size={24}
                  color={pin.length === 0 ? colors.faint : colors.ink}
                />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={`d-${d}-${i}`}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              onPress={() => press(d)}
              disabled={disabled}
            >
              <Text style={styles.keyText}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: 16,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dotError: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  pad: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  key: {
    width: '30%',
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySpacer: { width: '30%', height: 64 },
  keyPressed: {
    backgroundColor: colors.surface2,
    transform: [{ scale: 0.97 }],
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.ink,
  },
});
