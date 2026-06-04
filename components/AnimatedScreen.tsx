import React, { ReactNode, useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/lib/theme';

export type AnimatedScreenDirection = 'left' | 'right' | 'bottom' | 'top' | 'fade' | 'fade-up';

interface AnimatedScreenProps {
  children: ReactNode;
  direction?: AnimatedScreenDirection;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

const DIRECTION_OFFSETS: Record<AnimatedScreenDirection, { x: number; y: number }> = {
  left: { x: -28, y: 0 },
  right: { x: 28, y: 0 },
  bottom: { x: 0, y: 28 },
  top: { x: 0, y: -28 },
  fade: { x: 0, y: 0 },
  'fade-up': { x: 0, y: 18 },
};

export function AnimatedScreen({
  children,
  direction = 'fade-up',
  delay = 0,
  duration = 360,
  style,
}: AnimatedScreenProps) {
  const offset = DIRECTION_OFFSETS[direction];
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, {
        damping: 18,
        stiffness: 180,
        mass: 0.9,
      }),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p,
      transform: [
        { translateX: offset.x * (1 - p) },
        { translateY: offset.y * (1 - p) },
      ],
    };
  });

  return (
    <Animated.View
      style={[{ flex: 1, backgroundColor: colors.bg }, style, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedItemProps {
  index?: number;
  children: ReactNode;
  direction?: AnimatedScreenDirection;
  duration?: number;
  delayStep?: number;
  initialDelay?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedItem({
  index = 0,
  children,
  direction = 'fade-up',
  duration = 420,
  delayStep = 60,
  initialDelay = 0,
  style,
}: AnimatedItemProps) {
  const offset = DIRECTION_OFFSETS[direction];
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      initialDelay + index * delayStep,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [index, delayStep, initialDelay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p,
      transform: [
        { translateX: offset.x * (1 - p) },
        { translateY: offset.y * (1 - p) },
      ],
    };
  });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export default AnimatedScreen;
