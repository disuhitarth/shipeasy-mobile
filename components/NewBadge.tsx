import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle, Pressable } from 'react-native';
import { LocalStore } from '@/lib/localStore';
import { colors, shadows } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

interface NewBadgeProps {
  id: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  label?: string;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export function NewBadge({
  id,
  size = 'sm',
  style,
  label = 'NEW',
  onDismiss,
  dismissible = false,
}: NewBadgeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    LocalStore.getDismissedNews().then((list) => {
      if (alive) setVisible(!list.includes(id));
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const dismiss = useCallback(() => {
    Haptics.light();
    setVisible(false);
    void LocalStore.dismissNews(id);
    onDismiss?.();
  }, [id, onDismiss]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        style,
      ]}
    >
      <Text style={[styles.text, size === 'md' && styles.textMd]}>{label}</Text>
      {dismissible ? (
        <Pressable onPress={dismiss} hitSlop={6} style={styles.close}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amber,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    ...shadows.sm,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  text: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.6,
  },
  textMd: {
    fontSize: 10,
  },
  close: {
    marginLeft: 2,
  },
  closeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 12,
  },
});
