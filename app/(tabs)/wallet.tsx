import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import { useWalletData, useInfiniteWalletTransactions, type InfiniteWalletTxResult } from '@/lib/queries';
import { useBiometric } from '@/store/biometric';
import { useWallet } from '@/store/wallet';
import { BalanceCard } from '@/components/ui/BalanceCard';
import { Group } from '@/components/ui/Cell';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaggeredItem } from '@/components/Staggered';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PressableScale } from '@/components/PressableScale';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { toast } from '@/lib/toast';
import * as Haptics from '@/lib/haptics';
import type { Transaction } from '@/types';
import { preventCapture, allowCapture } from '@/lib/screenCapture';
import { copySensitive } from '@/lib/clipboard';

const TX_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  deposit: { icon: 'arrow-up', color: colors.green, bg: colors.greenSoft },
  shipment_charge: { icon: 'cube', color: colors.accent, bg: colors.accentSoft },
  refund: { icon: 'refresh', color: colors.amber, bg: colors.amberSoft },
  admin_credit: { icon: 'arrow-up', color: colors.green, bg: colors.greenSoft },
  admin_debit: { icon: 'arrow-down', color: colors.red, bg: colors.redSoft },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function calcStats(transactions: { type: string; amount: number }[]) {
  let shipped = 0, saved = 0, loaded = 0;
  for (const tx of transactions) {
    if (tx.type === 'shipment_charge') shipped += Math.abs(tx.amount);
    else if (tx.type === 'refund') saved += tx.amount;
    else if (tx.type === 'deposit' || tx.type === 'admin_credit') loaded += tx.amount;
  }
  return { shipped, saved, loaded };
}

function TransactionRow({ tx, index }: { tx: Transaction; index: number }) {
  const meta = TX_ICONS[tx.type] || { icon: 'ellipse', color: colors.faint, bg: colors.surface2 };
  return (
    <Animated.View
      entering={FadeInDown.duration(360).delay(Math.min(index, 12) * 50)}
      layout={LinearTransition.springify().damping(20).stiffness(220)}
    >
      <TouchableOpacity style={styles.txRow} activeOpacity={0.6}>
        <View style={[styles.txIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txLabel} numberOfLines={1}>{tx.description}</Text>
          <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
        </View>
        <Text style={[styles.txAmount, { color: tx.amount > 0 ? colors.green : colors.ink }]}>
          {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function TransactionList({ txQuery }: { txQuery: InfiniteWalletTxResult }) {
  const transactions = useMemo(
    () => (txQuery.data?.pages.flatMap((p) => p.transactions) ?? []),
    [txQuery.data],
  );

  const onEndReached = useCallback(() => {
    if (txQuery.hasNextPage && !txQuery.isFetchingNextPage) {
      txQuery.fetchNextPage();
    }
  }, [txQuery.hasNextPage, txQuery.isFetchingNextPage, txQuery]);

  if (txQuery.isLoading) {
    return (
      <View style={{ marginTop: spacing.md }}>
        <Skeleton height={56} radius={borderRadius.md} />
        <View style={{ height: 1 }} />
        <Skeleton height={56} radius={borderRadius.md} style={{ marginTop: 1 }} />
        <View style={{ height: 1 }} />
        <Skeleton height={56} radius={borderRadius.md} style={{ marginTop: 1 }} />
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <Animated.View entering={FadeInDown.duration(420).delay(220)} style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="wallet-outline" size={28} color={colors.faint} />
        </View>
        <Text style={styles.emptyTitle}>No activity yet</Text>
        <Text style={styles.emptySub}>Your transactions will appear here</Text>
      </Animated.View>
    );
  }

  return (
    <Group>
      <FlatList
        data={transactions}
        keyExtractor={(item, idx) => item._id || String(idx)}
        scrollEnabled={false}
        renderItem={({ item, index }) => <TransactionRow tx={item} index={index} />}
        ItemSeparatorComponent={() => <View style={styles.txSeparator} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          txQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.footerLoaderText}>Loading more…</Text>
            </View>
          ) : !txQuery.hasNextPage ? (
            <View style={styles.endOfList}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.faint} />
              <Text style={styles.endOfListText}>End of list</Text>
            </View>
          ) : null
        }
      />
    </Group>
  );
}

export default function WalletScreen() {
  const { data, isLoading, refetch } = useWalletData();
  const txQuery = useInfiniteWalletTransactions();
  const setBalance = useWallet((s) => s.setBalance);
  const biometricEnabled = useBiometric((s) => s.enabled);
  const markUnlocked = useBiometric((s) => s.markUnlocked);
  const [refreshing, setRefreshing] = useState(false);
  const [authing, setAuthing] = useState(false);
  const [requireAuth, setRequireAuth] = useState(false);
  const lastAuthAttempt = useRef(0);

  useEffect(() => {
    if (data?.balance != null) setBalance(data.balance);
  }, [data?.balance, setBalance]);

  useEffect(() => {
    if (!biometricEnabled) {
      setRequireAuth(false);
      return;
    }
    setRequireAuth(useBiometric.getState().shouldRequireAuth());
  }, [biometricEnabled]);

  useFocusEffect(
    useCallback(() => {
      preventCapture('wallet');
      if (biometricEnabled) {
        setRequireAuth(useBiometric.getState().shouldRequireAuth());
      }
      return () => {
        allowCapture('wallet');
      };
    }, [biometricEnabled]),
  );

  useEffect(() => {
    if (biometricEnabled && requireAuth && !authing) {
      const now = Date.now();
      if (now - lastAuthAttempt.current < 1500) return;
      lastAuthAttempt.current = now;
      doAuth();
    }
  }, [biometricEnabled, requireAuth, authing]);

  const doAuth = useCallback(async () => {
    setAuthing(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Wallet',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });
      if (result.success) {
        markUnlocked();
        setRequireAuth(false);
        Haptics.success();
      } else {
        setRequireAuth(true);
      }
    } finally {
      setAuthing(false);
    }
  }, [markUnlocked]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.selection();
    await Promise.all([refetch(), txQuery.refetch()]);
    setRefreshing(false);
    toast.success('Updated!');
  }, [refetch, txQuery]);

  const onCopyBalance = useCallback(async () => {
    const bal = data?.balance ?? 0;
    const ok = await copySensitive(`$${bal.toFixed(2)}`);
    if (ok) toast.info('Balance copied · clipboard clears in 60s');
  }, [data?.balance]);

  const stats = useMemo(() => calcStats(data?.transactions ?? []), [data?.transactions]);

  if (biometricEnabled && requireAuth) {
    return (
      <AnimatedScreen direction="fade">
        <View style={styles.container}>
          <Animated.View entering={FadeInDown.duration(420)} style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={48} color={colors.accent} />
            <Text style={styles.lockTitle}>Wallet Locked</Text>
            <Text style={styles.lockSub}>Authenticate to view your wallet</Text>
            <PressableScale style={styles.unlockBtn} onPress={doAuth} disabled={authing} haptic="medium">
              {authing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={20} color="#fff" />
                  <Text style={styles.unlockText}>Unlock</Text>
                </>
              )}
            </PressableScale>
          </Animated.View>
        </View>
      </AnimatedScreen>
    );
  }

  return (
    <AnimatedScreen direction="fade-up">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.title}>Wallet</Animated.Text>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <Skeleton height={140} radius={borderRadius.lg} />
            <View style={styles.statsRow}>
              <Skeleton height={80} radius={borderRadius.md} style={{ flex: 1 }} />
              <Skeleton height={80} radius={borderRadius.md} style={{ flex: 1 }} />
              <Skeleton height={80} radius={borderRadius.md} style={{ flex: 1 }} />
            </View>
            <Skeleton height={24} width="40%" style={{ marginTop: spacing.xl }} />
            <Skeleton height={200} radius={borderRadius.md} style={{ marginTop: spacing.md }} />
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(420).delay(60)}>
              <BalanceCard
                balance={data?.balance ?? 0}
                onAdd={() => router.push('/wallet/topup')}
                onCopyBalance={onCopyBalance}
                style={{ marginTop: spacing.lg }}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(420).delay(120)} style={styles.statsRow}>
              <StaggeredItem index={0} duration={300}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Shipped</Text>
                  <Text style={styles.statValue}>${stats.shipped.toFixed(2)}</Text>
                </View>
              </StaggeredItem>
              <StaggeredItem index={1} duration={300}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Saved</Text>
                  <Text style={[styles.statValue, { color: colors.green }]}>${stats.saved.toFixed(2)}</Text>
                </View>
              </StaggeredItem>
              <StaggeredItem index={2} duration={300}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Loaded</Text>
                  <Text style={[styles.statValue, { color: colors.accent }]}>${stats.loaded.toFixed(2)}</Text>
                </View>
              </StaggeredItem>
            </Animated.View>

            <Animated.Text entering={FadeInDown.duration(420).delay(180)} style={styles.sectionTitle}>Recent activity</Animated.Text>

            <TransactionList txQuery={txQuery} />
          </>
        )}
      </ScrollView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, color: colors.ink },
  loadingWrap: { gap: spacing.md, marginTop: spacing.lg },
  lockOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  lockTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },
  lockSub: { fontSize: 15, color: colors.muted, textAlign: 'center' },
  unlockBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent,
  },
  unlockText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 15,
    alignItems: 'center',
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  emptySub: { fontSize: 14, color: colors.muted },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  txSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginLeft: 68,
  },
  txIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  txDate: { fontSize: 12.5, color: colors.faint, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: spacing.lg,
  },
  footerLoaderText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  endOfList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.lg,
  },
  endOfListText: {
    fontSize: 13,
    color: colors.faint,
    fontWeight: '500',
  },
});
