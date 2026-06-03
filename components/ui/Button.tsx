import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  full?: boolean;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  full,
  disabled,
  loading,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        full && styles.full,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#0B0B12'} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`]]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: '#635BFF' },
  secondary: { backgroundColor: '#fff' },
  ghost: { backgroundColor: '#F7F7F9' },
  full: { flex: 1 },
  disabled: { opacity: 0.42 },
  text: { fontSize: 16, fontWeight: '600' },
  text_primary: { color: '#fff' },
  text_secondary: { color: '#0B0B12' },
  text_ghost: { color: '#0B0B12' },
});
