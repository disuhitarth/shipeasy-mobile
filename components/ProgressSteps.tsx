import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, borderRadius } from '@/lib/theme';

interface ProgressStepsProps {
  current: number;
  total: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: StyleProp<ViewStyle>;
  showLabels?: boolean;
  labels?: string[];
}

export function ProgressSteps({
  current,
  total,
  activeColor = colors.accent,
  inactiveColor = colors.hairline,
  style,
  showLabels = false,
  labels,
}: ProgressStepsProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}>
      {Array.from({ length: total }, (_, i) => (
        <ProgressBar
          key={i}
          index={i}
          current={current}
          total={total}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

interface ProgressBarProps {
  index: number;
  current: number;
  total: number;
  activeColor: string;
  inactiveColor: string;
}

function ProgressBar({ index, current, total, activeColor, inactiveColor }: ProgressBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (index < current) {
      progress.value = withSpring(1, { damping: 16, stiffness: 200, mass: 0.7 });
    } else if (index === current) {
      progress.value = withSpring(0.5, { damping: 16, stiffness: 200, mass: 0.7 });
    } else {
      progress.value = withSpring(0, { damping: 16, stiffness: 200, mass: 0.7 });
    }
  }, [index, current, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${8 + progress.value * 92}%`,
    backgroundColor: progress.value > 0 ? activeColor : inactiveColor,
  }));

  return (
    <View
      style={{
        flex: 1,
        height: 4,
        backgroundColor: inactiveColor,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function CircularProgress({
  progress,
  size = 48,
  strokeWidth = 4,
  color = colors.accent,
  trackColor = colors.hairline,
  style,
}: CircularProgressProps) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(progress, { damping: 18, stiffness: 180, mass: 0.7 });
  }, [progress, animatedProgress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedStyle = useAnimatedStyle(() => {
    const offset = circumference * (1 - animatedProgress.value);
    return {
      transform: [{ rotate: '-90deg' }],
    } as any;
  });

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: trackColor,
        }}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: color,
            borderRightColor: animatedProgress.value > 0.25 ? color : 'transparent',
            borderBottomColor: animatedProgress.value > 0.5 ? color : 'transparent',
            borderLeftColor: animatedProgress.value > 0.75 ? color : 'transparent',
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

interface StepIndicatorProps {
  steps: { label: string; done?: boolean; active?: boolean }[];
  style?: StyleProp<ViewStyle>;
}

export function StepIndicator({ steps, style }: StepIndicatorProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: s.done ? colors.green : s.active ? colors.accent : colors.surface2,
                borderWidth: 1.5,
                borderColor: s.done ? colors.green : s.active ? colors.accent : colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.done ? (
                <Text style={{ color: colors.white, fontSize: 14, fontWeight: '700' }}>✓</Text>
              ) : (
                <Text
                  style={{
                    color: s.active ? colors.white : colors.faint,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: s.active ? '700' : '500',
                color: s.done ? colors.green : s.active ? colors.accent : colors.muted,
              }}
            >
              {s.label}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: s.done ? colors.green : colors.hairline,
                marginHorizontal: 4,
                marginBottom: 18,
                borderRadius: 1,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default ProgressSteps;
