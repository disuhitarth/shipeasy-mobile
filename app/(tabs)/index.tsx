import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWalletData } from '@/lib/queries';
import { useWallet } from '@/store/wallet';
import { useEffect, useState, useCallback } from 'react';

export default function HomeScreen() {
  const { data: walletData, refetch } = useWalletData();
  const setBalance = useWallet((s) => s.setBalance);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    if (walletData?.balance != null) setBalance(walletData.balance);
  }, [walletData?.balance]);

  const quickActions = [
    { icon: 'cube' as const, label: 'Ship now', route: '/wizard', primary: true },
    { icon: 'sparkles' as const, label: 'Magic Batch', route: '/batch' },
    { icon: 'pricetags' as const, label: 'SKUs', route: '/skus' },
    { icon: 'wallet' as const, label: 'Wallet', route: '/wallet' },
    { icon: 'send' as const, label: 'Quick Ship', route: '/ship-now' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#635BFF" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AM</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>Alex Morgan</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications" size={20} color="#0B0B12" />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceGlow} />
        <View style={styles.balanceContent}>
          <View>
            <Text style={styles.balanceLabel}>Wallet balance</Text>
            <Text style={styles.balanceAmount}>
              ${(walletData?.balance ?? 0).toFixed(2)}
            </Text>
            <View style={styles.balanceFooter}>
              <Ionicons name="shield-checkmark" size={13} color="rgba(255,255,255,0.72)" />
              <Text style={styles.balanceNote}>CAD · Prepaid · Secured</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/wallet')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.qaGrid}>
        {quickActions.map((qa) => (
          <TouchableOpacity
            key={qa.label}
            style={[styles.qaItem, qa.primary && styles.qaPrimary]}
            onPress={() => router.push(qa.route)}
          >
            <View style={[styles.qaIcon, qa.primary && styles.qaIconPrimary]}>
              <Ionicons
                name={qa.icon}
                size={21}
                color={qa.primary ? '#fff' : '#635BFF'}
              />
            </View>
            <Text style={styles.qaLabel}>{qa.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Magic Batch Promo */}
      <TouchableOpacity
        style={styles.batchPromo}
        onPress={() => router.push('/batch')}
      >
        <View style={styles.batchIcon}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </View>
        <View style={styles.batchText}>
          <Text style={styles.batchTitle}>Ship in bulk with Magic Batch</Text>
          <Text style={styles.batchSub}>
            Paste a list or scan a photo — AI does the rest
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F5' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  greeting: { fontSize: 12.5, fontWeight: '600', color: '#9A9AA4' },
  userName: { fontSize: 16.5, fontWeight: '700', color: '#0B0B12', letterSpacing: -0.3 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#635BFF',
    borderWidth: 2,
    borderColor: '#fff',
  },
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
  balanceGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    opacity: 0.3,
  },
  balanceContent: {
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.2,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1.2,
    marginTop: 4,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
  },
  balanceNote: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.72)',
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  qaItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 9,
  },
  qaPrimary: {
    backgroundColor: '#635BFF',
  },
  qaIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#ECEBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  qaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B0B12',
  },
  batchPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#635BFF',
    marginTop: 16,
  },
  batchIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchText: { flex: 1 },
  batchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  batchSub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
