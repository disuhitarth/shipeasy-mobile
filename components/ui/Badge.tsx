import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '@/lib/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'pending': { bg: '#FBF0DA', text: '#9A6700', border: 'rgba(200,134,11,0.18)' },
  'label-created': { bg: '#ECEBFF', text: '#4F46E5', border: 'rgba(99,91,255,0.18)' },
  'picked-up': { bg: '#ECEBFF', text: '#4F46E5', border: 'rgba(99,91,255,0.18)' },
  'in-transit': { bg: '#ECEBFF', text: '#4F46E5', border: 'rgba(99,91,255,0.18)' },
  'out-for-delivery': { bg: '#E0E7FF', text: '#4338CA', border: 'rgba(99,91,255,0.18)' },
  'delivered': { bg: '#E2F4EC', text: '#157F52', border: 'rgba(30,158,106,0.18)' },
  'void-requested': { bg: '#F2F2F5', text: '#6B6B76', border: 'rgba(10,10,20,0.07)' },
  'voided': { bg: '#F2F2F5', text: '#6B6B76', border: 'rgba(10,10,20,0.07)' },
  'failed': { bg: '#FDE8E8', text: '#B53329', border: 'rgba(224,72,61,0.18)' },
};

const STATUS_LABELS: Record<string, string> = {
  'pending': 'Pending',
  'label-created': 'Label Ready',
  'picked-up': 'Picked Up',
  'in-transit': 'In Transit',
  'out-for-delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'void-requested': 'Void Requested',
  'voided': 'Voided',
  'failed': 'Failed',
};

interface BadgeProps {
  status: string;
}

export function Badge({ status }: BadgeProps) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const label = STATUS_LABELS[status] || status.replace(/-/g, ' ');
  const opacity = useRef(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity.current, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border, opacity: opacity.current },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: c.text }]} />
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600', letterSpacing: -0.1 },
});
