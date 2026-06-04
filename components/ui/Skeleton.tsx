import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, borderRadius } from '@/lib/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, radius = borderRadius.sm, style }: SkeletonProps) {
  const anim = useRef(new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim.current, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim.current, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.current.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.5, 0.3],
  });

  return (
    <Animated.View
      style={[{
        width: width as any,
        height,
        borderRadius: radius,
        backgroundColor: colors.surface2,
        opacity,
      }, style]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ padding: 18, backgroundColor: colors.surface, borderRadius: borderRadius.md, gap: 10 }, style]}>
      <Skeleton width="40%" height={14} />
      <Skeleton height={16} />
      <Skeleton width="70%" height={14} />
    </View>
  );
}
