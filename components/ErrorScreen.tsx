import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  ZoomOut,
  BounceIn,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import { PressableScale, PressableCard } from './PressableScale';

type ErrorVariant = '404' | '500' | 'network' | 'generic' | 'empty';

interface ErrorScreenProps {
  variant?: ErrorVariant;
  title?: string;
  message?: string;
  primaryAction?: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap };
  secondaryAction?: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap };
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_META: Record<ErrorVariant, { icon: keyof typeof Ionicons.glyphMap; gradient: readonly [string, string]; title: string; message: string }> = {
  '404': {
    icon: 'compass-outline',
    gradient: colors.purpleGrad,
    title: 'Page not found',
    message: 'The page you are looking for has drifted off the map.',
  },
  '500': {
    icon: 'construct-outline',
    gradient: colors.warmGrad,
    title: 'Something went wrong',
    message: 'We are working on it. Please try again in a moment.',
  },
  'network': {
    icon: 'cloud-offline-outline',
    gradient: colors.blueGrad,
    title: 'No connection',
    message: 'Check your internet and pull down to refresh.',
  },
  'empty': {
    icon: 'sparkles-outline',
    gradient: colors.purpleGrad,
    title: 'Nothing here yet',
    message: 'Start by creating your first item.',
  },
  'generic': {
    icon: 'alert-circle-outline',
    gradient: colors.purpleGrad,
    title: 'Oops!',
    message: 'An unexpected error occurred.',
  },
};

export function ErrorScreen({
  variant = 'generic',
  title,
  message,
  primaryAction,
  secondaryAction,
  onRetry,
  style,
}: ErrorScreenProps) {
  const meta = VARIANT_META[variant];
  const displayTitle = title ?? meta.title;
  const displayMessage = message ?? meta.message;

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing['3xl'],
          paddingVertical: spacing['5xl'],
        },
        style,
      ]}
    >
      <Animated.View
        entering={ZoomIn.springify().damping(10).stiffness(180)}
        style={[
          {
            width: 120,
            height: 120,
            borderRadius: 60,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing['2xl'],
            shadowColor: meta.gradient[0],
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 28,
            elevation: 8,
          },
        ]}
      >
        <View
          style={{
            position: 'absolute',
            inset: 0 as any,
            width: '100%',
            height: '100%',
            borderRadius: 60,
            backgroundColor: meta.gradient[0],
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: 60,
            backgroundColor: meta.gradient[1],
            opacity: 0.7,
            transform: [{ scale: 0.7 }],
          }}
        />
        <Ionicons name={meta.icon} size={48} color={colors.white} />
      </Animated.View>

      <Animated.Text
        entering={FadeInUp.delay(120).springify()}
        style={[
          typography.title2,
          { textAlign: 'center', color: colors.ink, marginBottom: spacing.sm },
        ]}
      >
        {displayTitle}
      </Animated.Text>

      <Animated.Text
        entering={FadeInUp.delay(200).springify()}
        style={[
          typography.caption,
          { textAlign: 'center', color: colors.muted, marginBottom: spacing['3xl'], maxWidth: 320 },
        ]}
      >
        {displayMessage}
      </Animated.Text>

      <Animated.View
        entering={FadeInUp.delay(280).springify()}
        style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {(primaryAction || (onRetry && { label: 'Try again', onPress: onRetry, icon: 'refresh' as const })) && (
          <PressableScale
            onPress={(primaryAction?.onPress ?? onRetry)!}
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
            {primaryAction?.icon && <Ionicons name={primaryAction.icon} size={18} color={colors.white} />}
            <Animated.Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>
              {primaryAction?.label ?? 'Try again'}
            </Animated.Text>
          </PressableScale>
        )}
        {secondaryAction && (
          <PressableScale
            onPress={secondaryAction.onPress}
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
            {secondaryAction.icon && <Ionicons name={secondaryAction.icon} size={18} color={colors.ink} />}
            <Animated.Text style={[typography.body, { color: colors.ink, fontWeight: '600' }]}>
              {secondaryAction.label}
            </Animated.Text>
          </PressableScale>
        )}
      </Animated.View>
    </View>
  );
}

interface InlineErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function InlineError({ title = 'Unable to load', message, onRetry, style }: InlineErrorProps) {
  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[
        {
          backgroundColor: colors.redSoft,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginVertical: spacing.sm,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.red,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="alert-circle" size={20} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Animated.Text style={[typography.body, { color: colors.ink, fontWeight: '600' }]}>{title}</Animated.Text>
        {message && (
          <Animated.Text style={[typography.caption, { color: colors.muted, marginTop: 2 }]}>{message}</Animated.Text>
        )}
      </View>
      {onRetry && (
        <PressableScale onPress={onRetry} haptic="light" hitSlop={12}>
          <Ionicons name="refresh" size={20} color={colors.red} />
        </PressableScale>
      )}
    </Animated.View>
  );
}

export default ErrorScreen;
