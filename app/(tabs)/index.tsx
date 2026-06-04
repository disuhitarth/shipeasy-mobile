import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/store/auth';
import { useWallet } from '@/store/wallet';
import { useWalletData, useShipments } from '@/lib/queries';
import { BalanceCard, QuickStatsWidget } from '@/components/BalanceCard';
import { colors, borderRadius, spacing, shadows, typography } from '@/lib/theme';
import { useEffect, useCallback, useState, useRef } from 'react';
import { StaggeredItem } from '@/components/Staggered';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PressableCard, PressableScale } from '@/components/PressableScale';
import { toast } from '@/lib/toast';
import { track } from '@/lib/analytics';
import * as Haptics from '@/lib/haptics';
import { QuickCostCalculator } from '@/components/QuickCostCalculator';
import { ActivityFeed } from '@/components/ActivityFeed';
import { NewBadge } from '@/components/NewBadge';
import { useSettings } from '@/store/settings';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { SwipeableRow } from '@/components/SwipeableRow';
import { BurstRing } from '@/components/ConfettiBurst';

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
  const [searchTerm, setSearchTerm] = useState('');
  const shippingGoal = useSettings((s) => s.shippingGoal);

  useEffect(() => {
    if (walletData?.balance != null) setBalance(walletData.balance);
  }, [walletData?.balance]);

  const lowBalanceNotifiedRef = useRef<boolean>(false);
  useEffect(() => {
    const balance = walletData?.balance ?? 0;
    if (balance < 10 && balance >= 0 && !lowBalanceNotifiedRef.current) {
      lowBalanceNotifiedRef.current = true;
      void track('wallet_low_balance', { balance, threshold: 10 });
    } else if (balance >= 10) {
      lowBalanceNotifiedRef.current = false;
    }
  }, [walletData?.balance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.selection();
    await refetch();
    setRefreshing(false);
    toast.success('Updated!');
  }, [refetch]);

  const onSearchSubmit = useCallback(() => {
    if (!searchTerm.trim()) return;
    router.push({
      pathname: '/shipments',
      params: { q: searchTerm },
    });
  }, [searchTerm]);

  const userName = user?.name ?? 'Guest';
  const initials = user?.name ? getInitials(user.name) : 'G';
  const balance = walletData?.balance ?? 0;
  const recentShipments = shipmentsData?.shipments?.slice(0, 3) ?? [];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const goalTip = (() => {
    switch (shippingGoal) {
      case 'daily':
        return 'Daily shipper · Tip: keep SKUs handy for repeat labels.';
      case 'weekly':
        return 'Weekly shipper · Tip: bulk send with Magic Batch to save time.';
      case 'monthly':
        return 'Monthly shipper · Tip: top up your wallet to skip re-auth.';
      case 'occasionally':
        return 'Occasional shipper · Tip: track your last shipment in one tap.';
      default:
        return 'Welcome! Set a shipping goal to personalise tips.';
    }
  })();

  const quickActions = [
    { icon: 'cube' as const, label: 'Ship a package', route: '/wizard', primary: true },
    { icon: 'search' as const, label: 'Track', route: '/shipments', primary: false },
    { icon: 'sparkles' as const, label: 'Magic Batch', route: '/batch', primary: false, badge: true },
    { icon: 'location' as const, label: 'Addresses', route: '/addresses', primary: false },
  ];

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
    <AnimatedScreen direction="fade-up" duration={420}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StaggeredItem index={0}>
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
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.userName}>{userName}</Text>
              </View>
            </View>
            <PressableScale
              style={styles.notifBtn}
              onPress={() => Haptics.light()}
              haptic="light"
            >
              <Ionicons name="notifications-outline" size={19} color={colors.ink} />
              <View style={styles.dot} />
            </PressableScale>
          </View>
        </StaggeredItem>

        <StaggeredItem index={1}>
          <View style={styles.searchWrap}>
            <TouchableOpacity
              style={styles.searchBar}
              activeOpacity={0.85}
              onPress={() => router.push('/shipments')}
            >
              <Ionicons name="search" size={18} color={colors.faint} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search shipments, recipients…"
                placeholderTextColor={colors.faint}
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={onSearchSubmit}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                pointerEvents="none"
              />
              {searchTerm.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchTerm('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.faint} />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchHint}>
                  <Text style={styles.searchHintText}>Tap to search</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </StaggeredItem>

        <StaggeredItem index={2}>
          <BalanceCard balance={balance} onAdd={() => router.push('/wallet')} />
        </StaggeredItem>

        <StaggeredItem index={3}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={14} color={colors.accent} />
            </View>
            <Text style={styles.tipText}>{goalTip}</Text>
          </View>
        </StaggeredItem>

        <StaggeredItem index={4}>
          <View style={styles.qaGrid}>
            {quickActions.map((qa) => (
              <PressableCard
                key={qa.label}
                style={[styles.qaItem, qa.primary && styles.qaPrimary]}
                onPress={() => router.push(qa.route as any)}
                haptic="light"
                scaleTo={0.96}
              >
                <View style={[styles.qaIcon, qa.primary && styles.qaIconPrimary]}>
                  <Ionicons name={qa.icon} size={21} color={qa.primary ? '#fff' : colors.accent} />
                </View>
                <Text style={[styles.qaLabel, qa.primary && { color: '#fff' }]}>
                  {qa.label}
                </Text>
                {qa.badge ? (
                  <View style={styles.qaBadge}>
                    <NewBadge id="feature-magic-batch" />
                  </View>
                ) : null}
              </PressableCard>
            ))}
          </View>
        </StaggeredItem>

        <StaggeredItem index={5}>
          <PressableCard
            style={styles.batchPromo}
            onPress={() => router.push('/batch')}
            haptic="light"
          >
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
              <View style={styles.batchTitleRow}>
                <Text style={styles.batchTitle}>Ship in bulk with Magic Batch</Text>
                <NewBadge id="feature-magic-batch" />
              </View>
              <Text style={styles.batchSub}>
                Paste a list or scan a photo — AI does the rest
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
          </PressableCard>
        </StaggeredItem>

        <StaggeredItem index={6}>
          <QuickCostCalculator />
        </StaggeredItem>

        <StaggeredItem index={7}>
          <ActivityFeed />
        </StaggeredItem>

        {recentShipments.length > 0 && (
          <>
            <StaggeredItem index={8}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent shipments</Text>
                <PressableScale
                  onPress={() => router.push('/shipments')}
                  haptic="light"
                  style={{ paddingVertical: 4, paddingHorizontal: 6 }}
                >
                  <Text style={styles.seeAll}>See all</Text>
                </PressableScale>
              </View>
            </StaggeredItem>
            <View style={styles.group}>
              {recentShipments.map((s, i) => (
                <StaggeredItem key={s._id} index={9 + i} delayStep={50}>
                  <PressableCard
                    style={[styles.shipmentCell, i > 0 && styles.shipmentCellBorder]}
                    onPress={() => router.push(`/shipments/${s.shipCode}`)}
                    haptic="light"
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
                  </PressableCard>
                </StaggeredItem>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </AnimatedScreen>
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
  searchWrap: {
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
  },
  searchHint: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surface2,
    borderRadius: 100,
  },
  searchHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.faint,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  tipIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.accent,
    fontWeight: '500',
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
    position: 'relative',
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
  qaBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
  batchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
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
