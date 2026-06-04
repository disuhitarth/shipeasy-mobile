import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, StyleProp, Dimensions, Text } from 'react-native';
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
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';

interface PatternBackgroundProps {
  variant?: 'dots' | 'grid' | 'mesh' | 'noise';
  opacity?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function PatternBackground({
  variant = 'dots',
  opacity = 0.5,
  color = colors.bgPattern,
  style,
}: PatternBackgroundProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity,
        },
        style,
      ]}
    >
      {variant === 'dots' && <DotsPattern color={color} />}
      {variant === 'grid' && <GridPattern color={color} />}
      {variant === 'mesh' && <MeshGradient />}
      {variant === 'noise' && <NoisePattern />}
    </View>
  );
}

function DotsPattern({ color }: { color: string }) {
  const dots = [];
  const cols = 16;
  const rows = 30;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offset = r % 2 === 0 ? 0 : 12;
      dots.push(
        <View
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            left: c * 24 + offset,
            top: r * 24,
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: color,
          }}
        />,
      );
    }
  }
  return <View style={{ width: '100%', height: '100%' }}>{dots}</View>;
}

function GridPattern({ color }: { color: string }) {
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        borderColor: color,
        borderWidth: 0.5,
        opacity: 0.4,
      }}
    />
  );
}

function MeshGradient() {
  return (
    <>
      <View
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: colors.accent,
          opacity: 0.05,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: colors.accent,
          opacity: 0.04,
        }}
      />
    </>
  );
}

function NoisePattern() {
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.accent,
        opacity: 0.02,
      }}
    />
  );
}

interface FloatingOrbProps {
  size?: number;
  color?: string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function FloatingOrb({
  size = 220,
  color = colors.accent,
  top,
  left,
  right,
  bottom,
  delay = 0,
  style,
}: FloatingOrbProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.07,
          top,
          left,
          right,
          bottom,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export default PatternBackground;
