import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';

interface ScreenHeaderProps {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  showBack?: boolean;
}

export function ScreenHeader({ title, rightLabel, onRightPress, rightIcon, showBack = true }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      {showBack ? (
        <TouchableOpacity style={styles.btn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
      ) : (
        <View style={styles.btn} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {rightLabel || rightIcon ? (
        <TouchableOpacity style={styles.btn} onPress={onRightPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {rightIcon ? <Ionicons name={rightIcon} size={20} color={colors.ink} /> : null}
          {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  btn: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    ...shadows.sm,
  },
  title: { fontSize: 17, fontWeight: '600', color: colors.ink, flex: 1, textAlign: 'center' },
  rightLabel: { fontSize: 14, fontWeight: '600', color: colors.accent },
});
