import React, { useEffect, useState } from 'react';
import { View, ViewStyle, StyleProp, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  ZoomIn,
  FadeInDown,
  BounceIn,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import { PressableScale } from './PressableScale';
import { BurstRing } from './ConfettiBurst';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  message?: string;
  cta?: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap };
  secondary?: { label: string; onPress: () => void };
  illustration?: 'parcel' | 'wallet' | 'sparkle' | 'compass' | 'box';
  gradient?: readonly [string, string];
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  bounce?: boolean;
}

const ICON_BG: Record<string, readonly [string, string]> = {
  parcel: colors.purpleGrad,
  wallet: colors.successGrad,
  sparkle: colors.purpleGrad,
  compass: colors.blueGrad,
  box: colors.warmGrad,
};

const ICON_BG_DEFAULT: readonly [string, string] = colors.purpleGrad;

export function EmptyState({
  icon = 'cube-outline',
  emoji,
  title,
  message,
  cta,
  secondary,
  illustration = 'parcel',
  gradient,
  style,
  compact = false,
  bounce = true,
}: EmptyStateProps) {
  const bgGradient = gradient ?? ICON_BG[illustration] ?? ICON_BG_DEFAULT;

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing['3xl'],
          paddingVertical: compact ? spacing.xl : spacing['5xl'],
        },
        style,
      ]}
    >
      <BouncingIcon gradient={bgGradient} icon={icon} emoji={emoji} compact={compact} bounce={bounce} />

      <Animated.Text
        entering={FadeInDown.delay(180).springify()}
        style={[
          typography.title2,
          { color: colors.ink, textAlign: 'center', marginTop: spacing.xl, marginBottom: spacing.sm },
        ]}
      >
        {title}
      </Animated.Text>

      {message && (
        <Animated.Text
          entering={FadeInDown.delay(260).springify()}
          style={[
            typography.caption,
            { color: colors.muted, textAlign: 'center', maxWidth: 320, lineHeight: 19 },
          ]}
        >
          {message}
        </Animated.Text>
      )}

      {(cta || secondary) && (
        <Animated.View
          entering={FadeInDown.delay(360).springify()}
          style={{
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing['2xl'],
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {cta && (
            <PressableScale
              onPress={cta.onPress}
              haptic="medium"
              style={({ pressed: _ }: any) => ({
                paddingHorizontal: spacing['2xl'],
                paddingVertical: 14,
                borderRadius: borderRadius.full,
                backgroundColor: colors.ink,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                ...shadows.md,
              })}
            >
              {cta.icon && <Ionicons name={cta.icon} size={18} color={colors.white} />}
              <Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>{cta.label}</Text>
            </PressableScale>
          )}
          {secondary && (
            <PressableScale
              onPress={secondary.onPress}
              haptic="light"
              style={{
                paddingHorizontal: spacing['2xl'],
                paddingVertical: 14,
                borderRadius: borderRadius.full,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Text style={[typography.body, { color: colors.ink, fontWeight: '600' }]}>{secondary.label}</Text>
            </PressableScale>
          )}
        </Animated.View>
      )}
    </View>
  );
}

interface BouncingIconProps {
  icon: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  gradient: readonly [string, string];
  compact?: boolean;
  bounce?: boolean;
}

function BouncingIcon({ icon, emoji, gradient, compact = false, bounce = true }: BouncingIconProps) {
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (!bounce) return;
    const startBounce = () => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    };
    const startRing = () => {
      ringScale.value = 1;
      ringOpacity.value = 0.4;
      ringScale.value = withRepeat(
        withTiming(2.2, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      );
      ringOpacity.value = withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      );
    };
    startBounce();
    startRing();
    return () => {
      scale.value = 1;
      ringScale.value = 1;
      ringOpacity.value = 0;
    };
  }, [bounce, scale, ringScale, ringOpacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const size = compact ? 76 : 100;

  return (
    <Animated.View
      entering={ZoomIn.springify().damping(8).stiffness(160)}
      style={{ width: size + 40, height: size + 40, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: gradient[0],
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: gradient[0],
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 6,
          },
          iconStyle,
        ]}
      >
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: size / 2,
            backgroundColor: gradient[0],
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: size / 2,
            backgroundColor: gradient[1],
            opacity: 0.6,
            transform: [{ scale: 0.78 }],
          }}
        />
        {emoji ? (
          <Text style={{ fontSize: compact ? 32 : 42 }}>{emoji}</Text>
        ) : (
          <Ionicons name={icon} size={compact ? 32 : 40} color={colors.white} />
        )}
      </Animated.View>
    </Animated.View>
  );
}

interface InlineEmptyProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export function InlineEmpty({ message, icon = 'information-circle', style }: InlineEmptyProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={16} color={colors.faint} />
      <Text style={[typography.caption, { color: colors.faint }]}>{message}</Text>
    </View>
  );
}

export default EmptyState;
