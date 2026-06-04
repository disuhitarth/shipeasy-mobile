import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'flat' | 'outlined' | 'gradient';
  style?: StyleProp<ViewStyle>;
  hairline?: boolean;
  padding?: keyof typeof spacing | number;
  rounded?: keyof typeof borderRadius;
  glow?: boolean;
  gradient?: readonly [string, string];
}

export function Card({
  children,
  onPress,
  variant = 'default',
  style,
  hairline = false,
  padding = 'lg',
  rounded = 'md',
  glow = false,
  gradient,
}: CardProps) {
  const press = useSharedValue(0);

  const handlePressIn = () => {
    if (!onPress) return;
    press.value = withSpring(1, { damping: 18, stiffness: 280, mass: 0.7 });
  };
  const handlePressOut = () => {
    if (!onPress) return;
    press.value = withSpring(0, { damping: 16, stiffness: 220, mass: 0.7 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (!onPress) return {} as any;
    const p = press.value;
    const scale = 1 - 0.015 * p;
    return { transform: [{ scale }] } as any;
  });

  const baseStyle: ViewStyle = {
    borderRadius: borderRadius[rounded],
    padding: typeof padding === 'number' ? padding : spacing[padding],
    overflow: 'hidden',
    backgroundColor: variant === 'flat' ? 'transparent' : colors.surface,
    borderWidth: variant === 'outlined' || hairline ? 1 : 0,
    borderColor: colors.hairline,
  };

  const containerStyle: ViewStyle = {
    ...baseStyle,
    ...(variant === 'default' ? shadows.sm : {}),
    ...(glow ? shadows.glow : {}),
  };

  const inner = (
    <Animated.View style={[containerStyle, animatedStyle, style]}>
      {variant === 'gradient' && gradient && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: gradient[0],
            opacity: 0.06,
            borderRadius: borderRadius[rounded],
          }}
        />
      )}
      <View style={{ position: 'relative' }}>{children}</View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

interface HairlineProps {
  vertical?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Hairline({ vertical = false, color = colors.hairline, style }: HairlineProps) {
  return (
    <View
      style={[
        {
          backgroundColor: color,
          ...(vertical ? { width: 1, alignSelf: 'stretch' } : { height: 1, alignSelf: 'stretch' }),
        },
        style,
      ]}
    />
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function GlassCard({ children, style, onPress }: GlassCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
          padding: spacing.lg,
          ...shadows.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Card;
