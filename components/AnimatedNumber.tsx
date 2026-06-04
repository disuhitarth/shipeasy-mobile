import React, { useEffect, useState } from 'react';
import { View, ViewStyle, StyleProp, Text as RNText, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { colors, typography } from '@/lib/theme';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (v: number) => string;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedText = Animated.createAnimatedComponent(RNText);

export function AnimatedNumber({
  value,
  duration = 800,
  formatter,
  style,
  prefix = '',
  suffix = '',
  decimals = 2,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const end = value;
    const startTime = Date.now();
    let raf: number;
    const step = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted = formatter
    ? formatter(display)
    : display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return (
    <RNText style={style}>
      {prefix}
      {formatted}
      {suffix}
    </RNText>
  );
}

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
}

export function CountUp({ to, from = 0, duration = 1200, delay = 0, style, prefix = '', suffix = '' }: CountUpProps) {
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const startTime = Date.now() + delay;
    let raf: number;
    const step = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        raf = requestAnimationFrame(step);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, from, duration, delay]);

  return (
    <RNText style={style}>
      {prefix}
      {display.toFixed(2)}
      {suffix}
    </RNText>
  );
}

export default AnimatedNumber;
