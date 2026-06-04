import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface CellProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  icon?: string;
  label?: string;
  chevron?: boolean;
}

function fw(w: string): any { return w; }

export function Cell({ children, onPress, style, icon, label, chevron }: CellProps) {
  return (
    <TouchableOpacity style={[styles.cell, style]} onPress={onPress} activeOpacity={0.6}>
      {icon && (
        <View style={styles.cellIcon}>
          <Ionicons name={icon as any} size={18} color={colors.ink} />
        </View>
      )}
      {label && <Text style={[styles.cellLabel, { fontWeight: fw('560') }]}>{label}</Text>}
      <View style={{ flex: 1 }}>{children}</View>
      {chevron && <Ionicons name="chevron-forward" size={18} color={colors.faint} />}
    </TouchableOpacity>
  );
}

export function Group({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.group, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  cellIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontSize: 15,
    color: colors.ink,
    flex: 1,
  },
});
