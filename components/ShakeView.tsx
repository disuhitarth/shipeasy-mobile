import React, { useEffect } from 'react';
import { ViewStyle, StyleProp, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';

interface ShakeViewProps {
  children: React.ReactNode;
  trigger?: number;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  onSettle?: () => void;
}

export function ShakeView({
  children,
  trigger = 0,
  intensity = 12,
  style,
  haptic = true,
  onSettle,
}: ShakeViewProps) {
  const offset = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    if (haptic) Haptics.error();
    offset.value = withSequence(
      withTiming(-intensity, { duration: 60, easing: Easing.out(Easing.cubic) }),
      withTiming(intensity, { duration: 60, easing: Easing.inOut(Easing.cubic) }),
      withTiming(-intensity * 0.7, { duration: 60, easing: Easing.inOut(Easing.cubic) }),
      withTiming(intensity * 0.7, { duration: 60, easing: Easing.inOut(Easing.cubic) }),
      withTiming(-intensity * 0.4, { duration: 60, easing: Easing.inOut(Easing.cubic) }),
      withTiming(intensity * 0.4, { duration: 60, easing: Easing.inOut(Easing.cubic) }),
      withTiming(0, { duration: 60, easing: Easing.out(Easing.cubic) }, () => {
        if (onSettle) {
        }
      }),
    );
  }, [trigger, intensity, haptic, offset, onSettle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

interface BounceViewProps {
  children: React.ReactNode;
  trigger?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function BounceView({ children, trigger = 0, delay = 0, style }: BounceViewProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.18, { damping: 6, stiffness: 240, mass: 0.5 }),
        withSpring(1, { damping: 10, stiffness: 220, mass: 0.6 }),
      ),
    );
  }, [trigger, delay, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

interface PulseViewProps {
  children: React.ReactNode;
  active?: boolean;
  minScale?: number;
  maxScale?: number;
  style?: StyleProp<ViewStyle>;
}

export function PulseView({ children, active = true, minScale = 0.96, maxScale = 1.04, style }: PulseViewProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(minScale, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    };
  }, [active, minScale, maxScale, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export default ShakeView;
