import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useShipments, useWalletData } from '@/lib/queries';
import { LocalStore } from '@/lib/localStore';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';
import { formatTimeAgo } from '@/lib/timeAgo';
import { StaggeredItem } from './Staggered';

interface ActivityItem {
  id: string;
  type: 'shipment' | 'topup' | 'address' | 'pin';
  title: string;
  subtitle: string;
  amount?: number;
  time: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  route: string;
}

interface ActivityFeedProps {
  style?: StyleProp<ViewStyle>;
  limit?: number;
  onPick?: (item: ActivityItem) => void;
}

export function ActivityFeed({ style, limit = 5, onPick }: ActivityFeedProps) {
  const { data: shipmentsData } = useShipments(1, undefined as any);
  const { data: walletData } = useWalletData();
  const [pinned, setPinned] = React.useState<string[]>([]);

  React.useEffect(() => {
    let alive = true;
    LocalStore.getPinned().then((p) => {
      if (alive) setPinned(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];
    const shipments = shipmentsData?.shipments ?? [];
    const recent = shipments.slice(0, 8);
    for (const s of recent) {
      list.push({
        id: `s-${s.shipCode}`,
        type: 'shipment',
        title: s.recipientName || (s.items?.[0]?.description ?? 'Shipment'),
        subtitle: `N° ${s.shipCode}`,
        amount: s.customerTotal,
        time: new Date(s.createdAt).getTime(),
        icon: 'cube',
        iconBg: colors.accentSoft,
        iconColor: colors.accent,
        route: `/shipments/${s.shipCode}`,
      });
    }
    const txs = (walletData?.transactions ?? []).slice(0, 5);
    for (const t of txs) {
      if (t.type !== 'deposit' && t.type !== 'admin_credit' && t.type !== 'refund') continue;
      list.push({
        id: `t-${t._id}`,
        type: 'topup',
        title: t.description,
        subtitle: 'Wallet top-up',
        amount: t.amount,
        time: new Date(t.createdAt).getTime(),
        icon: t.type === 'refund' ? 'refresh' : 'arrow-up',
        iconBg: colors.greenSoft,
        iconColor: colors.green,
        route: '/(tabs)/wallet',
      });
    }
    if (pinned.length > 0) {
      for (const code of pinned.slice(0, 3)) {
        const found = shipments.find((s: any) => s.shipCode === code);
        if (!found) continue;
        list.unshift({
          id: `p-${code}`,
          type: 'pin',
          title: found.recipientName || 'Pinned shipment',
          subtitle: `Pinned · N° ${code}`,
          time: new Date(found.createdAt).getTime(),
          icon: 'pin',
          iconBg: colors.amberSoft,
          iconColor: colors.amber,
          route: `/shipments/${code}`,
        });
      }
    }
    return list.sort((a, b) => b.time - a.time).slice(0, limit);
  }, [shipmentsData, walletData, pinned, limit]);

  if (items.length === 0) return null;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent activity</Text>
        <Pressable onPress={() => router.push('/shipments' as any)} hitSlop={6} style={styles.seeAllBtn}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {items.map((item, i) => (
          <StaggeredItem key={item.id} index={i} delayStep={40} duration={320}>
            <Pressable
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={() => {
                if (onPick) onPick(item);
                else router.push(item.route as any);
              }}
            >
              <View style={[styles.icon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={16} color={item.iconColor} />
              </View>
              <View style={styles.info}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              <View style={styles.right}>
                {item.amount != null ? (
                  <Text style={[styles.amount, item.amount < 0 && styles.amountNeg]}>
                    {item.amount < 0 ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
                  </Text>
                ) : null}
                <Text style={styles.time}>{formatTimeAgo(item.time)}</Text>
              </View>
            </Pressable>
          </StaggeredItem>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    paddingVertical: 4,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  list: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline2,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.faint,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  amountNeg: {
    color: colors.red,
  },
  time: {
    fontSize: 11,
    color: colors.faint,
    fontWeight: '500',
  },
});
