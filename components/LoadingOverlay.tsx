import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, StyleProp, Text, Pressable, Modal as RNModal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import { PressableScale } from './PressableScale';
import { CircularProgress } from './ProgressSteps';

interface LoadingOverlayProps {
  visible: boolean;
  title?: string;
  message?: string;
  progress?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  cancelable?: boolean;
  onCancel?: () => void;
}

export function LoadingOverlay({
  visible,
  title = 'Loading',
  message,
  progress,
  icon = 'hourglass-outline',
  cancelable = false,
  onCancel,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <RNModal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing['3xl'],
        }}
      >
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          exiting={FadeOut.duration(150)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing['3xl'],
            alignItems: 'center',
            width: '100%',
            maxWidth: 320,
            ...shadows.lg,
          }}
        >
          <View style={{ marginBottom: spacing.lg }}>
            {progress != null ? (
              <CircularProgress progress={progress} size={56} strokeWidth={5} color={colors.accent} />
            ) : (
              <SpinnerIcon icon={icon} />
            )}
          </View>
          <Text style={[typography.title3, { color: colors.ink, textAlign: 'center', marginBottom: 4 }]}>
            {title}
          </Text>
          {message && (
            <Text style={[typography.caption, { color: colors.muted, textAlign: 'center', maxWidth: 260 }]}>
              {message}
            </Text>
          )}
          {progress != null && (
            <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700' }}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          )}
          {cancelable && onCancel && (
            <PressableScale
              onPress={onCancel}
              haptic="light"
              style={{
                marginTop: spacing.lg,
                paddingHorizontal: spacing.xl,
                paddingVertical: 10,
                borderRadius: borderRadius.full,
                backgroundColor: colors.surface2,
              }}
            >
              <Text style={[typography.body, { color: colors.ink, fontWeight: '600' }]}>Cancel</Text>
            </PressableScale>
          )}
        </Animated.View>
      </View>
    </RNModal>
  );
}

function SpinnerIcon({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotate]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View style={style}>
        <Ionicons name={icon} size={28} color={colors.accent} />
      </Animated.View>
    </View>
  );
}

interface PulsingDotProps {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function PulsingDot({ color = colors.green, size = 8, style }: PulsingDotProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(0.7, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [scale, opacity]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          outerStyle,
        ]}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export default LoadingOverlay;
