import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConnectionState } from '@/lib/connection';
import { colors, spacing, shadows, borderRadius } from '@/lib/theme';

const STORAGE_KEY = 'offline_banner_dismissed';

async function readDismissed(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
  return false;
}

async function writeDismissed(value: boolean): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        if (value) localStorage.setItem(STORAGE_KEY, '1');
        else localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }
}

export function OfflineBanner() {
  const state = useConnectionState();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);
  const translateY = useRef(new Animated.Value(-60));
  const opacity = useRef(new Animated.Value(0));

  useEffect(() => {
    void readDismissed().then(setDismissed);
  }, []);

  const visible = state === 'offline' && !dismissed;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY.current, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 220 }),
        Animated.timing(opacity.current, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY.current, { toValue: -60, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity.current, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const handleDismiss = () => {
    setDismissed(true);
    void writeDismissed(true);
  };

  if (!visible && state !== 'offline') return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
          transform: [{ translateY: translateY.current }],
          opacity: opacity.current,
        },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.amber} />
        </View>
        <Text style={styles.text} numberOfLines={1}>
          You're offline. Changes will sync when reconnected.
        </Text>
        <Pressable onPress={handleDismiss} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={16} color={colors.muted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9000,
    elevation: 9,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.amberSoft,
    borderRadius: borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...shadows.sm,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, fontSize: 13, color: colors.amber, fontWeight: '600' },
  close: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OfflineBanner;
