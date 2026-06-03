import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'pending': { bg: '#FBF0DA', text: '#C8860B' },
  'label-created': { bg: '#ECEBFF', text: '#635BFF' },
  'in-transit': { bg: '#ECEBFF', text: '#635BFF' },
  'out-for-delivery': { bg: '#ECEBFF', text: '#635BFF' },
  'delivered': { bg: '#E2F4EC', text: '#1E9E6A' },
  'void-requested': { bg: '#F7F7F9', text: '#9A9AA4' },
  'voided': { bg: '#F7F7F9', text: '#9A9AA4' },
  'failed': { bg: '#FDE8E8', text: '#E0483D' },
};

interface BadgeProps {
  status: string;
}

export function Badge({ status }: BadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <Text style={[styles.text, { color: colors.text }]}>
        {status.replace(/-/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12.5, fontWeight: '600', textTransform: 'capitalize' },
});
