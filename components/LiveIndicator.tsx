import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { formatTimeAgo } from '@/lib/timeAgo';
import type { TrackingConnectionStatus } from '@/lib/useTrackingPolling';

interface LiveIndicatorProps {
  status: TrackingConnectionStatus;
  lastFetchedAt: number | null;
  compact?: boolean;
}

const COPY: Record<TrackingConnectionStatus, { label: string; tint: { bg: string; fg: string; dot: string }; icon: keyof typeof Ionicons.glyphMap }> = {
  idle: {
    label: 'Idle',
    tint: { bg: colors.surface2, fg: colors.muted, dot: colors.faint },
    icon: 'time-outline',
  },
  disabled: {
    label: 'Manual refresh',
    tint: { bg: colors.surface2, fg: colors.muted, dot: colors.faint },
    icon: 'pause-circle-outline',
  },
  offline: {
    label: 'Offline',
    tint: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
    icon: 'cloud-offline-outline',
  },
  connecting: {
    label: 'Connecting…',
    tint: { bg: colors.accentSoft, fg: colors.accent, dot: colors.accent },
    icon: 'sync-outline',
  },
  live: {
    label: 'Live',
    tint: { bg: colors.greenSoft, fg: colors.green, dot: colors.green },
    icon: 'radio-button-on',
  },
  reconnecting: {
    label: 'Reconnecting…',
    tint: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
    icon: 'refresh-outline',
  },
};

export function LiveIndicator({ status, lastFetchedAt, compact = false }: LiveIndicatorProps) {
  const opacity = useRef(new Animated.Value(1));
  const rotate = useRef(new Animated.Value(0));

  useEffect(() => {
    if (status === 'live') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity.current, { toValue: 0.35, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity.current, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    opacity.current.setValue(1);
    return undefined;
  }, [status, opacity]);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') {
      const loop = Animated.loop(
        Animated.timing(rotate.current, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    }
    rotate.current.stopAnimation();
    rotate.current.setValue(0);
    return undefined;
  }, [status, rotate]);

  const copy = COPY[status] ?? COPY.idle;
  const spin = rotate.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ago = lastFetchedAt ? formatTimeAgo(lastFetchedAt) : null;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.pill, { backgroundColor: copy.tint.bg }]}>
        {status === 'live' ? (
          <Animated.View style={[styles.dot, { backgroundColor: copy.tint.dot, opacity: opacity.current }]} />
        ) : status === 'connecting' || status === 'reconnecting' ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync-outline" size={12} color={copy.tint.fg} />
          </Animated.View>
        ) : (
          <Ionicons name={copy.icon} size={12} color={copy.tint.fg} />
        )}
        <Text style={[styles.label, { color: copy.tint.fg }]}>{copy.label}</Text>
      </View>
      {!compact && ago ? (
        <Text style={styles.ago}>Updated {ago}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  containerCompact: { gap: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  ago: { fontSize: 11.5, color: colors.faint, fontWeight: '500' },
});

export default LiveIndicator;
