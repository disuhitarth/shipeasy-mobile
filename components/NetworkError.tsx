import React, { useEffect, useState } from 'react';
import { View, Text, ViewStyle, StyleProp, Pressable, ScrollView, RefreshControl, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import { PressableScale } from './PressableScale';
import { ErrorScreen } from './ErrorScreen';
import { FloatingOrb } from './PatternBackground';

interface NetworkErrorProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
  showRefresh?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function NetworkError({
  onRetry,
  title,
  message,
  showRefresh = false,
  refreshing = false,
  onRefresh,
}: NetworkErrorProps) {
  if (showRefresh) {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          ) : undefined
        }
      >
        <ErrorScreen
          variant="network"
          title={title ?? 'No connection'}
          message={message ?? 'Check your internet and pull down to refresh.'}
          onRetry={onRetry}
        />
      </ScrollView>
    );
  }
  return (
    <ErrorScreen
      variant="network"
      title={title ?? 'No connection'}
      message={message ?? 'Check your internet and try again.'}
      onRetry={onRetry}
    />
  );
}

interface ConnectionStatusProps {
  online: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ConnectionStatus({ online, style }: ConnectionStatusProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: borderRadius.full,
          backgroundColor: online ? colors.greenSoft : colors.redSoft,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: online ? colors.green : colors.red,
        }}
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: online ? colors.green : colors.red,
          letterSpacing: 0.3,
        }}
      >
        {online ? 'ONLINE' : 'OFFLINE'}
      </Text>
    </View>
  );
}

export default NetworkError;
