import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useWalletData } from '@/lib/queries';
import { useBiometric } from '@/store/biometric';
import { useWallet } from '@/store/wallet';
import { BalanceCard } from '@/components/ui/BalanceCard';
import { Group } from '@/components/ui/Cell';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, spacing } from '@/lib/theme';

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

export default function WalletScreen() {
  const { data, isLoading, refetch } = useWalletData();
  const setBalance = useWallet((s) => s.setBalance);
  const biometricEnabled = useBiometric((s) => s.enabled);
  const biometricLocked = useBiometric((s) => s.locked);
  const unlock = useBiometric((s) => s.unlock);
  const [refreshing, setRefreshing] = useState(false);
  const [authing, setAuthing] = useState(false);

  useEffect(() => {
    if (data?.balance != null) setBalance(data.balance);
  }, [data?.balance, setBalance]);

  useEffect(() => {
    if (biometricEnabled && biometricLocked && !authing) {
      doAuth();
    }
  }, [biometricEnabled, biometricLocked]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const doAuth = useCallback(async () => {
    setAuthing(true);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Wallet',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });
    if (result.success) unlock();
    setAuthing(false);
  }, [unlock]);

  const transactions = data?.transactions ?? [];
  const stats = calcStats(transactions);

  if (biometricEnabled && biometricLocked) {
    return (
      <View style={styles.container}>
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={48} color={colors.accent} />
          <Text style={styles.lockTitle}>Wallet Locked</Text>
          <Text style={styles.lockSub}>Authenticate to view your wallet</Text>
          <TouchableOpacity style={styles.unlockBtn} onPress={doAuth} disabled={authing}>
            {authing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="finger-print" size={20} color="#fff" />
                <Text style={styles.unlockText}>Unlock</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={styles.title}>Wallet</Text>

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
          <BalanceCard
            balance={data?.balance ?? 0}
            onAdd={() => router.push('/wallet/topup')}
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Shipped</Text>
              <Text style={styles.statValue}>${stats.shipped.toFixed(2)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={[styles.statValue, { color: colors.green }]}>${stats.saved.toFixed(2)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Loaded</Text>
              <Text style={[styles.statValue, { color: colors.accent }]}>${stats.loaded.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recent activity</Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="wallet-outline" size={28} color={colors.faint} />
              </View>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptySub}>Your transactions will appear here</Text>
            </View>
          ) : (
            <Group>
              {transactions.map((tx, i) => {
                const meta = TX_ICONS[tx.type] || { icon: 'ellipse', color: colors.faint, bg: colors.surface2 };
                return (
                  <TouchableOpacity key={tx._id || i} style={styles.txRow} activeOpacity={0.6}>
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
                );
              })}
            </Group>
          )}
        </>
      )}
    </ScrollView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  txIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  txDate: { fontSize: 12.5, color: colors.faint, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
