import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, borderRadius, typography } from '@/lib/theme';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted' | 'pending' | 'in-transit' | 'delivered' | 'exception';

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  pulse?: boolean;
  outlined?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

const TONE_BG: Record<BadgeTone, string> = {
  neutral: '#F1F1F4',
  success: colors.greenSoft,
  warning: colors.amberSoft,
  danger: colors.redSoft,
  info: '#E0F2FE',
  accent: colors.accentSoft,
  muted: colors.surface2,
  pending: colors.amberSoft,
  'in-transit': colors.accentSoft,
  delivered: colors.greenSoft,
  exception: colors.redSoft,
};

const TONE_FG: Record<BadgeTone, string> = {
  neutral: colors.ink,
  success: colors.green,
  warning: colors.amber,
  danger: colors.red,
  info: '#0369A1',
  accent: colors.accent,
  muted: colors.muted,
  pending: colors.amber,
  'in-transit': colors.accent,
  delivered: colors.green,
  exception: colors.red,
};

const TONE_DOT: Record<BadgeTone, string> = {
  neutral: colors.faint,
  success: colors.green,
  warning: colors.amber,
  danger: colors.red,
  info: '#0369A1',
  accent: colors.accent,
  muted: colors.faint,
  pending: colors.amber,
  'in-transit': colors.accent,
  delivered: colors.green,
  exception: colors.red,
};

export function Badge({ children, tone = 'neutral', icon, pulse = false, outlined = false, size = 'sm', style }: BadgeProps) {
  const dotScale = useSharedValue(1);

  useEffect(() => {
    if (!pulse) return;
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 700, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      true,
    );
    return () => {
      dotScale.value = 1;
    };
  }, [pulse, dotScale]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const pad = size === 'sm' ? { paddingHorizontal: 8, paddingVertical: 3 } : { paddingHorizontal: 10, paddingVertical: 5 };
  const fontSize = size === 'sm' ? 11.5 : 12.5;
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <Animated.View
      entering={undefined as any}
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          borderRadius: borderRadius.full,
          backgroundColor: outlined ? 'transparent' : TONE_BG[tone],
          borderWidth: outlined ? 1 : 0,
          borderColor: TONE_FG[tone],
          ...pad,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={iconSize} color={TONE_FG[tone]} />
      ) : pulse ? (
        <Animated.View
          style={[
            {
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: TONE_DOT[tone],
            },
            dotStyle,
          ]}
        />
      ) : null}
      <Animated.Text
        style={[
          typography.badge,
          { color: TONE_FG[tone], fontSize },
        ]}
      >
        {children}
      </Animated.Text>
    </Animated.View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeTone; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
    pending: { tone: 'pending', label: 'Pending', icon: 'time-outline' },
    label_created: { tone: 'pending', label: 'Label created', icon: 'pricetag-outline' },
    'label-created': { tone: 'pending', label: 'Label created', icon: 'pricetag-outline' },
    in_transit: { tone: 'in-transit', label: 'In transit', icon: 'airplane-outline' },
    'in-transit': { tone: 'in-transit', label: 'In transit', icon: 'airplane-outline' },
    out_for_delivery: { tone: 'in-transit', label: 'Out for delivery', icon: 'car-outline' },
    'out-for-delivery': { tone: 'in-transit', label: 'Out for delivery', icon: 'car-outline' },
    delivered: { tone: 'delivered', label: 'Delivered', icon: 'checkmark-circle' },
    exception: { tone: 'exception', label: 'Exception', icon: 'alert-circle' },
    voided: { tone: 'muted', label: 'Voided', icon: 'close-circle' },
    cancelled: { tone: 'muted', label: 'Cancelled', icon: 'close-circle' },
  };
  const m = map[status] ?? { tone: 'muted' as BadgeTone, label: status, icon: 'help-circle' as keyof typeof Ionicons.glyphMap };
  return <Badge tone={m.tone} icon={m.icon} pulse={m.tone === 'in-transit' || m.tone === 'pending'} size="sm">{m.label}</Badge>;
}

export default Badge;
