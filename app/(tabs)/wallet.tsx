import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useWalletData, useAutoReload } from '@/lib/queries';
import { useAuth } from '@/store/auth';
import { useBiometric } from '@/store/biometric';

const TX_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  deposit: { icon: 'arrow-up', color: '#1E9E6A' },
  shipment_charge: { icon: 'cube', color: '#635BFF' },
  refund: { icon: 'refresh', color: '#C8860B' },
};

export default function WalletScreen() {
  const { data, isLoading, refetch } = useWalletData();
  const isGuest = useAuth((s) => s.isGuest);
  const autoReloadMut = useAutoReload();
  const [refreshing, setRefreshing] = useState(false);
  const [authing, setAuthing] = useState(false);
  const [showAuto, setShowAuto] = useState(false);
  const [arEnabled, setArEnabled] = useState(false);
  const [arThreshold, setArThreshold] = useState('10');
  const [arAmount, setArAmount] = useState('50');

  const biometricEnabled = useBiometric((s) => s.enabled);
  const biometricLocked = useBiometric((s) => s.locked);
  const unlock = useBiometric((s) => s.unlock);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Auto-prompt when biometric is locked
  useEffect(() => {
    if (biometricEnabled && biometricLocked && !authing) {
      doAuth();
    }
  }, [biometricEnabled, biometricLocked]);

  // Sync auto-reload state from API
  useEffect(() => {
    const ar = (data as any)?.autoReload;
    if (ar) {
      setArEnabled(ar.enabled ?? false);
      setArThreshold(String(ar.threshold ?? 10));
      setArAmount(String(ar.amount ?? 50));
    }
  }, [data]);

  const doAuth = useCallback(async () => {
    setAuthing(true);
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    // Check which type is available for UI messaging
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Wallet',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      unlock();
    }
    setAuthing(false);
  }, [unlock]);

  const transactions = data?.transactions ?? [];

  // Show biometric lock when wallet is locked
  if (biometricEnabled && biometricLocked) {
    return (
      <View style={styles.container}>
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={48} color="#635BFF" />
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#635BFF" />}
    >
      <Text style={styles.title}>Wallet</Text>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceGlow} />
        <View style={styles.balanceContent}>
          <View>
            <Text style={styles.balanceLabel}>Wallet balance</Text>
            <Text style={styles.balanceAmount}>
              ${(data?.balance ?? 0).toFixed(2)}
            </Text>
            <View style={styles.balanceFooter}>
              <Ionicons name="shield-checkmark" size={13} color="rgba(255,255,255,0.72)" />
              <Text style={styles.balanceNote}>CAD · Prepaid · Secured</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/wallet/topup')}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={() => router.push('/wallet/topup')}
        >
          <Ionicons name="add" size={19} color="#fff" />
          <Text style={styles.actionPrimaryText}>Add funds</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionSecondary]}
          onPress={() => router.push('/wizard')}
        >
          <Ionicons name="arrow-up" size={19} color="#0B0B12" />
          <Text style={styles.actionSecondaryText}>Ship</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Spent this month</Text>
          <Text style={styles.statValue}>$41.19</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Labels bought</Text>
          <Text style={styles.statValue}>3</Text>
        </View>
      </View>

      {/* Transactions */}
      <Text style={styles.sectionTitle}>Transactions</Text>
      {transactions.length === 0 && !isLoading && (
        <Text style={styles.emptyText}>No transactions yet</Text>
      )}
      <View style={styles.txGroup}>
        {transactions.slice(0, 20).map((tx, i) => {
          const meta = TX_ICONS[tx.type] || { icon: 'ellipse', color: '#9A9AA4' };
          return (
            <View key={tx._id || i} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: `${meta.color}20` }]}>
                <Ionicons name={meta.icon} size={18} color={meta.color} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{tx.description}</Text>
                <Text style={styles.txSub}>{tx.createdAt?.slice(0, 10)}</Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.amount > 0 ? '#1E9E6A' : '#0B0B12' },
                ]}
              >
                {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Auto-Reload */}
      <TouchableOpacity style={styles.autoHeader} onPress={() => setShowAuto((s) => !s)}>
        <View style={styles.autoHeaderLeft}>
          <Ionicons name="refresh" size={18} color="#635BFF" />
          <Text style={styles.autoHeaderText}>Auto-Reload</Text>
        </View>
        <Ionicons name={showAuto ? 'chevron-up' : 'chevron-down'} size={18} color="#9A9AA4" />
      </TouchableOpacity>
      {showAuto && (
        <View style={styles.autoCard}>
          <View style={styles.autoRow}>
            <Text style={styles.autoLabel}>Enable auto-reload</Text>
            <Switch
              value={arEnabled}
              onValueChange={setArEnabled}
              trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
              thumbColor={arEnabled ? '#635BFF' : '#fff'}
            />
          </View>
          {arEnabled && (
            <>
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>Reload when balance drops below</Text>
                <View style={styles.autoInputRow}>
                  <Text style={styles.autoDollar}>$</Text>
                  <TextInput
                    style={styles.autoInput}
                    value={arThreshold}
                    onChangeText={setArThreshold}
                    keyboardType="number-pad"
                    placeholder="10"
                    placeholderTextColor="#9A9AA4"
                  />
                </View>
              </View>
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>Add funds amount</Text>
                <View style={styles.autoInputRow}>
                  <Text style={styles.autoDollar}>$</Text>
                  <TextInput
                    style={styles.autoInput}
                    value={arAmount}
                    onChangeText={setArAmount}
                    keyboardType="number-pad"
                    placeholder="50"
                    placeholderTextColor="#9A9AA4"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.autoSaveBtn}
                onPress={async () => {
                  await autoReloadMut.mutateAsync({
                    enabled: arEnabled,
                    threshold: parseInt(arThreshold) || 10,
                    amount: parseInt(arAmount) || 50,
                  });
                }}
                disabled={autoReloadMut.isPending}
              >
                {autoReloadMut.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.autoSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, marginTop: 6 },

  // Lock overlay
  lockOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40,
  },
  lockTitle: { fontSize: 22, fontWeight: '700', color: '#0B0B12' },
  lockSub: { fontSize: 15, color: '#6B6B76', textAlign: 'center' },
  unlockBtn: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 50, paddingHorizontal: 28, borderRadius: 14, backgroundColor: '#635BFF',
  },
  unlockText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  balanceCard: {
    borderRadius: 30,
    backgroundColor: '#635BFF',
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  balanceGlow: { ...StyleSheet.absoluteFill, backgroundColor: 'transparent' },
  balanceContent: {
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.82)', letterSpacing: 0.2 },
  balanceAmount: { fontSize: 38, fontWeight: '700', color: '#fff', letterSpacing: -1.2, marginTop: 4, fontVariant: ['tabular-nums'] },
  balanceFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  balanceNote: { fontSize: 12.5, color: 'rgba(255,255,255,0.72)' },
  addBtn: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, borderRadius: 14 },
  actionPrimary: { backgroundColor: '#635BFF' },
  actionSecondary: { backgroundColor: '#fff' },
  actionPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  actionSecondaryText: { color: '#0B0B12', fontSize: 16, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 15 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#9A9AA4' },
  statValue: { fontSize: 21, fontWeight: '700', color: '#0B0B12', marginTop: 5, fontVariant: ['tabular-nums'] },
  sectionTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4, marginTop: 28, marginBottom: 12 },
  emptyText: { color: '#9A9AA4', fontSize: 14, textAlign: 'center', marginTop: 20 },
  txGroup: { backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,20,0.07)' },
  txIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14.5, fontWeight: '600', color: '#0B0B12' },
  txSub: { fontSize: 12.5, color: '#9A9AA4', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // Auto-Reload
  autoHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 28, marginBottom: 12,
  },
  autoHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autoHeaderText: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  autoCard: { backgroundColor: '#fff', borderRadius: 22, padding: 16, gap: 14 },
  autoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  autoLabel: { fontSize: 14, fontWeight: '500', color: '#0B0B12', flex: 1 },
  autoInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  autoDollar: { fontSize: 16, fontWeight: '600', color: '#9A9AA4' },
  autoInput: {
    backgroundColor: '#F7F7F9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 16, fontWeight: '700', color: '#0B0B12', width: 80, textAlign: 'center',
  },
  autoSaveBtn: {
    height: 44, borderRadius: 12, backgroundColor: '#635BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  autoSaveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
