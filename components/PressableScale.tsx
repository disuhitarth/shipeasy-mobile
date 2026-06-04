import React, { ReactNode, useCallback, useMemo } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type HapticKind = 'none' | 'light' | 'medium' | 'success' | 'warning' | 'error' | 'selection';

interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  scaleTo?: number;
  duration?: number;
  haptic?: HapticKind;
  hapticOnPress?: boolean;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

function triggerHaptic(kind: HapticKind) {
  switch (kind) {
    case 'light':
      Haptics.light();
      break;
    case 'medium':
      Haptics.medium();
      break;
    case 'success':
      Haptics.success();
      break;
    case 'warning':
      Haptics.warning();
      break;
    case 'error':
      Haptics.error();
      break;
    case 'selection':
      Haptics.light();
      break;
    case 'none':
    default:
      break;
  }
}

export function PressableScale({
  children,
  scaleTo = 0.96,
  duration = 80,
  haptic = 'none',
  hapticOnPress = true,
  onPressIn,
  onPressOut,
  style,
  pressedStyle,
  disabled,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(
    (e: any) => {
      pressed.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.quad),
      });
      onPressIn?.(e);
    },
    [duration, onPressIn, pressed],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      pressed.value = withTiming(0, {
        duration: 140,
        easing: Easing.out(Easing.quad),
      });
      onPressOut?.(e);
    },
    [onPressOut, pressed],
  );

  const handlePress = useCallback(
    (e: any) => {
      if (haptic !== 'none' && hapticOnPress) triggerHaptic(haptic);
      rest.onPress?.(e);
    },
    [haptic, hapticOnPress, rest],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const p = pressed.value;
    return {
      transform: [{ scale: 1 - (1 - scaleTo) * p }],
    };
  });

  const composedStyle = useMemo(
    () => [style, animatedStyle],
    [style, animatedStyle],
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={composedStyle as any}
    >
      {children}
    </AnimatedPressable>
  );
}

interface PressableCardProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  scaleTo?: number;
  haptic?: HapticKind;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function PressableCard({
  children,
  scaleTo = 0.99,
  haptic = 'light',
  style,
  disabled,
  ...rest
}: PressableCardProps) {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(
    (e: any) => {
      pressed.value = withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) });
      rest.onPressIn?.(e);
    },
    [pressed, rest],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      pressed.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });
      rest.onPressOut?.(e);
    },
    [pressed, rest],
  );

  const handlePress = useCallback(
    (e: any) => {
      if (haptic !== 'none') triggerHaptic(haptic);
      rest.onPress?.(e);
    },
    [haptic, rest],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const p = pressed.value;
    const scale = 1 - (1 - scaleTo) * p;
    const shadow = interpolate(p, [0, 1], [8, 4]);
    const elevation = interpolate(p, [0, 1], [4, 2]);
    return {
      transform: [{ scale }],
      shadowOpacity: 0.06 + 0.04 * p,
      shadowRadius: shadow,
      elevation,
    } as any;
  });

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[style, animatedStyle] as any}
    >
      {children}
    </AnimatedPressable>
  );
}

export default PressableScale;
