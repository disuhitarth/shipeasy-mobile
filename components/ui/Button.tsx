import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '@/lib/theme';

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  full?: boolean;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

function fw(w: string): any { return w; }

export function Button({
  children, onPress, variant = 'primary', full, disabled, loading, style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], full && styles.full, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'dark' ? '#fff' : colors.ink} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`]]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 20,
    letterSpacing: -0.2,
  },
  primary: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  secondary: {
    backgroundColor: colors.surface,
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  ghost: { backgroundColor: colors.surface2 },
  dark: { backgroundColor: colors.ink },
  full: { width: '100%' },
  disabled: { opacity: 0.42 },
  text: { fontSize: 16, fontWeight: fw('640'), letterSpacing: -0.2 },
  text_primary: { color: colors.white },
  text_secondary: { color: colors.ink },
  text_ghost: { color: colors.ink },
  text_dark: { color: colors.white },
});
