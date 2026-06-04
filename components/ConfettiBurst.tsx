import React, { useEffect, useMemo } from 'react';
import { View, ViewStyle, StyleProp, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/lib/theme';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  delay: number;
  shape: 'circle' | 'square' | 'star';
}

interface ConfettiBurstProps {
  trigger?: number;
  count?: number;
  colors?: string[];
  duration?: number;
  originX?: number;
  originY?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  onComplete?: () => void;
}

export function ConfettiBurst({
  trigger = 0,
  count = 36,
  colors: palette = [colors.accent, colors.green, colors.amber, '#EC4899', '#3B82F6', '#FBBF24'],
  duration = 1400,
  originX = 0.5,
  originY = 0.5,
  radius = 220,
  style,
  onComplete,
}: ConfettiBurstProps) {
  const screen = Dimensions.get('window');
  const containerW = screen.width;
  const containerH = 360;

  const particles = useMemo<Particle[]>(() => {
    const out: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const distance = radius * (0.6 + Math.random() * 0.4);
      const shapeRand = Math.random();
      out.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * distance,
        vy: Math.sin(angle) * distance - 40,
        color: palette[i % palette.length] ?? colors.accent,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 720,
        delay: Math.random() * 80,
        shape: shapeRand < 0.4 ? 'circle' : shapeRand < 0.75 ? 'square' : 'star',
      });
    }
    return out;
  }, [count, palette, radius]);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished && onComplete) runOnJS(onComplete)();
    });
  }, [trigger, duration, progress, onComplete]);

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: containerH }, style]}>
      {particles.map((p) => (
        <ParticleItem
          key={p.id}
          particle={p}
          progress={progress}
          originX={originX}
          originY={originY}
          containerW={containerW}
          containerH={containerH}
        />
      ))}
    </View>
  );
}

interface ParticleItemProps {
  particle: Particle;
  progress: Animated.SharedValue<number>;
  originX: number;
  originY: number;
  containerW: number;
  containerH: number;
}

function ParticleItem({ particle, progress, originX, originY, containerW, containerH }: ParticleItemProps) {
  const startX = containerW * originX - particle.size / 2;
  const startY = containerH * originY - particle.size / 2;

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const delay = particle.delay / 1400;
    const localT = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));

    const easedX = particle.vx * localT;
    const gravity = 280;
    const easedY = particle.vy * localT + 0.5 * gravity * localT * localT;
    const opacity = interpolate(localT, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
    const scale = interpolate(localT, [0, 0.2, 1], [0.2, 1.1, 0.6]);
    const rotate = particle.rotation + particle.rotationSpeed * localT;

    return {
      transform: [
        { translateX: easedX },
        { translateY: easedY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
      opacity,
    } as any;
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
        },
        particle.shape === 'circle' ? { borderRadius: particle.size / 2 } : null,
        particle.shape === 'square' ? { borderRadius: 2 } : null,
        particle.shape === 'star' ? { borderRadius: 2 } : null,
        animatedStyle,
      ]}
    />
  );
}

interface BurstRingProps {
  trigger?: number;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function BurstRing({ trigger = 0, color = colors.accent, size = 80, style }: BurstRingProps) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = 0.4;
    opacity.value = 0.6;
    scale.value = withTiming(2.4, { duration: 700, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [trigger, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
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
          borderWidth: 2,
          borderColor: color,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export default ConfettiBurst;
