import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, borderRadius } from '@/lib/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, radius = borderRadius.sm, style }: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const containerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.32, 0.55, 0.32]);
    return { opacity };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-220, 220]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.surface2,
          overflow: 'hidden',
        },
        containerStyle,
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 140,
            backgroundColor: 'rgba(255,255,255,0.6)',
            opacity: 0.7,
          },
          shimmerStyle,
        ]}
      />
    </Animated.View>
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

export default Skeleton;
