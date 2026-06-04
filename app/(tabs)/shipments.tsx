import { View, Text, StyleSheet, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useInfiniteShipments } from '@/lib/queries';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { PressableCard, PressableScale } from '@/components/PressableScale';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { useDebounce } from '@/lib/useDebounce';
import { toast } from '@/lib/toast';
import * as Haptics from '@/lib/haptics';

const STATUS_TABS = ['All', 'Active', 'Delivered'];

const STATUS_FILTER: Record<string, string | undefined> = {
  All: undefined,
  Active: '^(pending|label-created|picked-up|in-transit|out-for-delivery)$',
  Delivered: '^delivered$',
};

type SortKey = 'recent' | 'oldest' | 'value_high' | 'value_low';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Most recent' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'value_high', label: 'Highest value' },
  { key: 'value_low', label: 'Lowest value' },
];

function EmptyState({ query, onClear }: { query?: string; onClear?: () => void }) {
  if (query) {
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="search-outline" size={36} color={colors.faint} />
        </View>
        <Text style={styles.emptyTitle}>No results for "{query}"</Text>
        <Text style={styles.emptySub}>Try a different search term</Text>
        {onClear ? (
          <PressableScale style={styles.clearSearchBtn} onPress={onClear} haptic="light">
            <Ionicons name="close-circle" size={16} color={colors.white} />
            <Text style={styles.clearSearchText}>Clear search</Text>
          </PressableScale>
        ) : null}
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cube-outline" size={36} color={colors.faint} />
      </View>
      <Text style={styles.emptyTitle}>No shipments yet</Text>
      <Text style={styles.emptySub}>Create your first label to get started</Text>
    </Animated.View>
  );
}

function ShipmentCard({ shipment, index }: { shipment: any; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(Math.min(index, 12) * 50)}
      layout={LinearTransition.springify().damping(20).stiffness(200)}
    >
      <PressableCard
        style={styles.card}
        onPress={() => router.push(`/shipments/${shipment.shipCode}`)}
        haptic="light"
      >
        <View style={styles.cardTop}>
          <View style={styles.pkgIcon}>
            <Ionicons name="cube" size={20} color={colors.muted} />
          </View>
          <View style={styles.routeSection}>
            <View style={styles.routeEnd}>
              <Text style={styles.routeLbl}>From</Text>
              <Text style={styles.routeCity} numberOfLines={1}>
                {shipment.items?.[0]?.description || 'Sender'}
              </Text>
            </View>
            <View style={styles.routeLine}>
              <View style={styles.routeTruck}>
                <Ionicons name="car" size={12} color={colors.accent} />
              </View>
            </View>
            <View style={styles.routeEnd}>
              <Text style={styles.routeLbl}>To</Text>
              <Text style={styles.routeCity} numberOfLines={1}>
                {shipment.recipientCity}, {shipment.recipientProvinceCode}
              </Text>
            </View>
          </View>
          <Badge status={shipment.status} />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {shipment.service && (
              <Text style={styles.carrierText}>{shipment.service}</Text>
            )}
            {shipment.trackingCode && (
              <Text style={styles.trackingText} numberOfLines={1}>
                {shipment.trackingCode}
              </Text>
            )}
          </View>
          <Text style={styles.priceText}>${shipment.customerTotal.toFixed(2)}</Text>
        </View>
      </PressableCard>
    </Animated.View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={44} height={44} radius={13} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </View>
            <Skeleton width={70} height={26} radius={100} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.hairline }}>
            <View style={{ gap: 4 }}>
              <Skeleton width={80} height={10} />
              <Skeleton width={120} height={12} />
            </View>
            <Skeleton width={60} height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

function FooterLoader() {
  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={colors.accent} />
      <Text style={styles.footerLoaderText}>Loading more…</Text>
    </View>
  );
}

function EndOfList() {
  return (
    <View style={styles.endOfList}>
      <Ionicons name="checkmark-circle-outline" size={18} color={colors.faint} />
      <Text style={styles.endOfListText}>End of list</Text>
    </View>
  );
}

export default function ShipmentsScreen() {
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const debouncedSearch = useDebounce(search, 300);
  const isDebouncing = search !== debouncedSearch;

  const filter = useMemo(
    () => ({ status: STATUS_FILTER[tab], sort, search: debouncedSearch || undefined }),
    [tab, sort, debouncedSearch],
  );

  const {
    data,
    refetch,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteShipments(filter);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.selection();
    await refetch();
    setRefreshing(false);
    toast.success('Updated!');
  }, [refetch]);

  const shipments = useMemo(
    () => (data?.pages.flatMap((p) => p.shipments) ?? []),
    [data],
  );

  const clearSearch = useCallback(() => {
    Haptics.light();
    setSearch('');
  }, []);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const showInitialSkeleton = isLoading && shipments.length === 0;

  return (
    <AnimatedScreen direction="fade-up">
      <View style={styles.container}>
        <View style={styles.headerWrap}>
          <Animated.Text entering={FadeInDown.duration(380)} style={styles.title}>Shipments</Animated.Text>

          <Animated.View entering={FadeInDown.duration(380).delay(50)}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.faint} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by tracking N°, recipient, code…"
                placeholderTextColor={colors.faint}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {isDebouncing ? (
                <ActivityIndicator size="small" color={colors.faint} />
              ) : search.length > 0 ? (
                <TouchableOpacity
                  onPress={clearSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.faint} />
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(380).delay(100)}>
            <View style={styles.segment}>
              {STATUS_TABS.map((t) => (
                <PressableScale
                  key={t}
                  style={[styles.segBtn, tab === t && styles.segBtnActive]}
                  onPress={() => {
                    if (t !== tab) Haptics.light();
                    setTab(t);
                  }}
                  haptic="light"
                  scaleTo={0.96}
                >
                  <Text style={[styles.segText, tab === t && styles.segTextActive]}>
                    {t}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(380).delay(150)}>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => (
                <PressableScale
                  key={opt.key}
                  style={[styles.sortChip, sort === opt.key && styles.sortChipActive]}
                  onPress={() => {
                    if (sort !== opt.key) Haptics.selection();
                    setSort(opt.key);
                  }}
                  haptic="selection"
                  scaleTo={0.95}
                >
                  <Text style={[styles.sortChipText, sort === opt.key && styles.sortChipTextActive]}>
                    {opt.label}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </Animated.View>
        </View>

        <Animated.FlatList
          data={shipments}
          keyExtractor={(item) => item.shipCode}
          renderItem={({ item, index }) => <ShipmentCard shipment={item} index={index} />}
          contentContainerStyle={styles.content}
          ListEmptyComponent={showInitialSkeleton ? <LoadingSkeleton /> : <EmptyState query={debouncedSearch} onClear={clearSearch} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <FooterLoader />
            ) : !hasNextPage && shipments.length > 0 ? (
              <EndOfList />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  headerWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.ink,
    marginTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 3,
    gap: 2,
    marginTop: spacing.lg,
  },
  segBtn: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  segText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.muted,
  },
  segTextActive: {
    color: colors.ink,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  sortChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  sortChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.muted,
  },
  sortChipTextActive: {
    color: colors.accent,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: 'rgba(10,10,25,0.06)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pkgIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeEnd: {
    flexShrink: 0,
  },
  routeLbl: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.faint,
  },
  routeCity: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.ink,
    marginTop: 2,
    maxWidth: 80,
  },
  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderTopWidth: 2,
    borderTopColor: colors.hairline,
    position: 'relative',
    minWidth: 30,
  },
  routeTruck: {
    position: 'absolute',
    top: -13,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  footerLeft: {
    gap: 2,
    flex: 1,
  },
  carrierText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  trackingText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.faint,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  emptySub: {
    fontSize: 14,
    color: colors.muted,
  },
  clearSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
    marginTop: spacing.md,
  },
  clearSearchText: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: '600',
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    shadowColor: 'rgba(10,10,25,0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: spacing.xl,
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
    paddingVertical: spacing.xl,
  },
  endOfListText: {
    fontSize: 13,
    color: colors.faint,
    fontWeight: '500',
  },
});
