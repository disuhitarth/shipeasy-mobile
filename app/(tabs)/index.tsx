import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/store/auth';
import { useWallet } from '@/store/wallet';
import { useWalletData, useShipments } from '@/lib/queries';
import { BalanceCard } from '@/components/ui/BalanceCard';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { useEffect, useRef, useCallback, useState } from 'react';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === 'delivered' || s === 'completed') return { bg: '#E2F4EC', fg: '#1E9E6A' };
  if (s === 'pending' || s === 'label-created') return { bg: '#FBF0DA', fg: '#C8860B' };
  return { bg: '#ECEBFF', fg: '#635BFF' };
}

function formatStatus(status: string) {
  return status
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function HomeScreen() {
  const user = useAuth((s) => s.user);
  const { data: walletData, refetch } = useWalletData();
  const { data: shipmentsData } = useShipments(1);
  const setBalance = useWallet((s) => s.setBalance);
  const [refreshing, setRefreshing] = useState(false);

  const animCount = 7;
  const animValues = useRef([...Array(animCount)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel(
      animValues.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 500,
          delay: 20 + i * 60,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  useEffect(() => {
    if (walletData?.balance != null) setBalance(walletData.balance);
  }, [walletData?.balance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const userName = user?.name ?? 'Guest';
  const initials = user?.name ? getInitials(user.name) : 'G';
  const balance = walletData?.balance ?? 0;
  const recentShipments = shipmentsData?.shipments?.slice(0, 3) ?? [];

  const quickActions = [
    { icon: 'cube' as const, label: 'Ship a package', route: '/wizard', primary: true },
    { icon: 'search' as const, label: 'Track', route: '/shipments', primary: false },
    { icon: 'sparkles' as const, label: 'Magic Batch', route: '/batch', primary: false },
    { icon: 'location' as const, label: 'Addresses', route: '/addresses', primary: false },
  ];

  function StaggerItem({ index, children }: { index: number; children: React.ReactNode }) {
    return (
      <Animated.View
        style={{
          opacity: animValues[index],
          transform: [
            {
              translateY: animValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        }}
      >
        {children}
      </Animated.View>
    );
  }

  function PkgStatusIcon({ status, size = 44 }: { status: string; size?: number }) {
    const c = statusColor(status);
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: c.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="cube-outline" size={size * 0.5} color={c.fg} />
      </View>
    );
  }

  function StatusBadge({ status }: { status: string }) {
    const c = statusColor(status);
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 4,
          paddingHorizontal: 9,
          borderRadius: 100,
          backgroundColor: c.bg,
        }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.fg }} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: c.fg }}>
          {formatStatus(status)}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <LinearGradient
              colors={['#8B7BFF', '#635BFF', '#4B45D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={19} color={colors.ink} />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <StaggerItem index={0}>
        <BalanceCard balance={balance} onAdd={() => router.push('/wallet')} />
      </StaggerItem>

      {/* Quick Actions */}
      <StaggerItem index={1}>
        <View style={styles.qaGrid}>
          {quickActions.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              style={[styles.qaItem, qa.primary && styles.qaPrimary]}
              onPress={() => router.push(qa.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.qaIcon, qa.primary && styles.qaIconPrimary]}>
                <Ionicons name={qa.icon} size={21} color={qa.primary ? '#fff' : colors.accent} />
              </View>
              <Text style={[styles.qaLabel, qa.primary && { color: '#fff' }]}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </StaggerItem>

      {/* Magic Batch Promo */}
      <StaggerItem index={2}>
        <TouchableOpacity style={styles.batchPromo} onPress={() => router.push('/batch')} activeOpacity={0.9}>
          <LinearGradient
            colors={['#8B7BFF', '#635BFF', '#4B45D6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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
      </StaggerItem>

      {/* Recent Shipments */}
      {recentShipments.length > 0 && (
        <>
          <StaggerItem index={3}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent shipments</Text>
              <TouchableOpacity onPress={() => router.push('/shipments')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
          </StaggerItem>
          <View style={styles.group}>
            {recentShipments.map((s, i) => (
              <StaggerItem key={s._id} index={4 + i}>
                <TouchableOpacity
                  style={[styles.shipmentCell, i > 0 && styles.shipmentCellBorder]}
                  onPress={() => router.push(`/shipments/${s.shipCode}`)}
                  activeOpacity={0.7}
                >
                  <PkgStatusIcon status={s.status} />
                  <View style={styles.shipmentInfo}>
                    <Text style={styles.shipmentName} numberOfLines={1}>
                      {s.items?.[0]?.description || s.recipientName}
                    </Text>
                    <Text style={styles.shipmentId}>N° {s.shipCode}</Text>
                  </View>
                  <View style={styles.shipmentRight}>
                    <StatusBadge status={s.status} />
                    <Text style={styles.shipmentEta}>
                      {new Date(s.createdAt).toLocaleDateString('en-CA', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              </StaggerItem>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  greeting: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.faint,
  },
  userName: {
    fontSize: 16.5,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  qaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
  },
  qaItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 9,
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  qaPrimary: {
    backgroundColor: colors.accent,
  },
  qaIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  qaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  batchPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 26,
    elevation: 6,
  },
  batchIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchText: {
    flex: 1,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  seeAll: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.accent,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    shadowColor: 'rgba(10,10,25,0.06)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
  },
  shipmentCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.lg,
  },
  shipmentCellBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  shipmentInfo: {
    flex: 1,
    minWidth: 0,
  },
  shipmentName: {
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  shipmentId: {
    fontSize: 12.5,
    color: colors.faint,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  shipmentRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  shipmentEta: {
    fontSize: 12,
    color: colors.muted,
  },
});
