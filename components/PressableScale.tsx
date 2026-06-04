import React, { useCallback, useEffect, useRef } from 'react';
import { View, ViewStyle, StyleProp, Pressable, Platform } from 'react-native';
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
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

export type HapticKind = 'none' | 'light' | 'medium' | 'success' | 'warning' | 'error' | 'selection';

interface PressableScaleProps extends Omit<React.ComponentProps<typeof Pressable>, 'style' | 'children'> {
  children: React.ReactNode;
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
    case 'light': Haptics.light(); break;
    case 'medium': Haptics.medium(); break;
    case 'success': Haptics.success(); break;
    case 'warning': Haptics.warning(); break;
    case 'error': Haptics.error(); break;
    case 'selection': Haptics.selection(); break;
    case 'none':
    default: break;
  }
}

export function PressableScale({
  children,
  scaleTo = 0.96,
  duration = 70,
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
      if (disabled) return;
      pressed.value = withSpring(1, { damping: 18, stiffness: 320, mass: 0.6 });
      onPressIn?.(e);
    },
    [duration, onPressIn, pressed, disabled],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      pressed.value = withSpring(0, { damping: 16, stiffness: 220, mass: 0.6 });
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

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface PressableCardProps extends Omit<React.ComponentProps<typeof Pressable>, 'style' | 'children'> {
  children: React.ReactNode;
  scaleTo?: number;
  haptic?: HapticKind;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function PressableCard({
  children,
  scaleTo = 0.985,
  haptic = 'light',
  style,
  disabled,
  ...rest
}: PressableCardProps) {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(
    (e: any) => {
      if (disabled) return;
      pressed.value = withSpring(1, { damping: 18, stiffness: 280, mass: 0.7 });
      rest.onPressIn?.(e);
    },
    [pressed, rest, disabled],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      pressed.value = withSpring(0, { damping: 16, stiffness: 220, mass: 0.7 });
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
    return {
      transform: [{ scale }],
    } as any;
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default PressableScale;
