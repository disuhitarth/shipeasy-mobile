import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocalStore, type SearchScope } from '@/lib/localStore';
import { colors, spacing, borderRadius } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

interface RecentSearchChipsProps {
  scope: SearchScope;
  visible: boolean;
  onPick: (term: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function RecentSearchChips({ scope, visible, onPick, style }: RecentSearchChipsProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    LocalStore.getSearchHistory(scope).then((list) => {
      if (alive) setHistory(list);
    });
    return () => {
      alive = false;
    };
  }, [scope, visible, refreshKey]);

  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, [visible]);

  const onClear = useCallback(() => {
    Haptics.light();
    void LocalStore.clearSearchHistory(scope).then(() => {
      setHistory([]);
    });
  }, [scope]);

  if (!visible || history.length === 0) return null;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent searches</Text>
        <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={12} color={colors.muted} />
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>
      <View style={styles.chipRow}>
        {history.map((term) => (
          <Pressable
            key={term}
            style={styles.chip}
            onPress={() => {
              Haptics.selection();
              onPick(term);
            }}
          >
            <Ionicons name="time-outline" size={12} color={colors.muted} />
            <Text style={styles.chipText} numberOfLines={1}>
              {term}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.sm,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clearText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.muted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.hairline,
    maxWidth: 200,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.ink,
    flexShrink: 1,
  },
});
