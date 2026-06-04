import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '@/lib/theme';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  iconColor?: string;
  iconBg?: string;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
  iconColor,
  iconBg,
}: EmptyStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconBox, iconBg ? { backgroundColor: iconBg } : null]}>
        <Ionicons name={icon} size={36} color={iconColor || colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  btnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
