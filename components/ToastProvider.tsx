import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';
import { registerToastHost, type ToastType } from '@/lib/toast';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
}

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
};

const TINT: Record<ToastType, { bg: string; fg: string }> = {
  success: { bg: colors.greenSoft, fg: colors.green },
  error: { bg: colors.redSoft, fg: colors.red },
  info: { bg: colors.accentSoft, fg: colors.accent },
  warning: { bg: colors.amberSoft, fg: colors.amber },
};

const DEFAULT_DURATION = 3000;
let __id = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => {
      const target = current.find((t) => t.id === id);
      if (!target) return current;
      Animated.parallel([
        Animated.timing(target.opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(target.translateY, { toValue: -16, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setToasts((latest) => latest.filter((t) => t.id !== id));
      });
      return current;
    });
  }, []);

  const show = useCallback(
    (message: string, type: ToastType, duration: number) => {
      const id = __id++;
      const item: ToastItem = {
        id,
        message,
        type,
        duration,
        translateY: new Animated.Value(-24),
        opacity: new Animated.Value(0),
      };
      setToasts((current) => [...current, item]);
      Animated.parallel([
        Animated.timing(item.translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(item.opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    registerToastHost((opts) => show(opts.message, opts.type, opts.duration));
    return () => registerToastHost(null);
  }, [show]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const topOffset = Platform.OS === 'web' ? spacing.lg : insets.top + spacing.sm;

  return (
    <>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { top: topOffset }]}>
        {toasts.map((t) => {
          const tint = TINT[t.type];
          return (
            <Animated.View
              key={t.id}
              style={[styles.toastWrap, { opacity: t.opacity, transform: [{ translateY: t.translateY }] }]}
            >
              <Pressable
                onPress={() => dismiss(t.id)}
                style={styles.toastInner}
                android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
              >
                <View style={[styles.toastIcon, { backgroundColor: tint.bg }]}>
                  <Ionicons name={ICONS[t.type]} size={20} color={tint.fg} />
                </View>
                <Text style={styles.toastText} numberOfLines={3}>
                  {t.message}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: spacing.lg,
  },
  toastWrap: {
    marginBottom: spacing.sm,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.md,
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    ...typography.body,
    flex: 1,
    fontSize: 14.5,
  },
});

export default ToastProvider;
