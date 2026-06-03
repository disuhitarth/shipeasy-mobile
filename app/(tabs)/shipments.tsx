import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useShipments } from '@/lib/queries';

const STATUS_TABS = ['All', 'Active', 'Delivered'];

export default function ShipmentsScreen() {
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const { data, refetch } = useShipments(1, tab === 'All' ? undefined : tab);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const shipments = data?.shipments ?? [];

  const filtered = search
    ? shipments.filter(
        (s) =>
          s.shipCode.toLowerCase().includes(search.toLowerCase()) ||
          s.recipientName.toLowerCase().includes(search.toLowerCase()),
      )
    : shipments;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#635BFF" />}
    >
      <Text style={styles.title}>Shipments</Text>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9A9AA4" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by tracking N°"
          placeholderTextColor="#9A9AA4"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Tabs */}
      <View style={styles.segment}>
        {STATUS_TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.segBtn, tab === t && styles.segBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.segText, tab === t && styles.segTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Shipment List */}
      <View style={styles.list}>
        {filtered.map((shipment) => (
          <TouchableOpacity
            key={shipment.shipCode}
            style={styles.card}
            onPress={() => router.push(`/shipments/${shipment.shipCode}`)}
          >
            <View style={styles.cardRow}>
              <View style={styles.pkgIcon}>
                <Ionicons name="cube" size={22} color="#635BFF" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardItem} numberOfLines={1}>
                  {shipment.items?.[0]?.description || 'Parcel'}
                </Text>
                <Text style={styles.cardCode}>N° {shipment.shipCode}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusBg(shipment.status) }]}>
                <View style={[styles.badgeDot, { backgroundColor: statusColor(shipment.status) }]} />
                <Text style={[styles.badgeText, { color: statusColor(shipment.status) }]}>
                  {shipment.status.replace(/-/g, ' ')}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.footerLabel}>To</Text>
                <Text style={styles.footerValue}>
                  {shipment.recipientCity}, {shipment.recipientProvinceCode}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.footerLabel}>Paid</Text>
                <Text style={styles.footerAmount}>
                  ${shipment.customerTotal.toFixed(2)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'delivered': return '#1E9E6A';
    case 'pending': return '#C8860B';
    case 'void-requested':
    case 'voided': return '#9A9AA4';
    default: return '#635BFF';
  }
}

function statusBg(status: string) {
  switch (status) {
    case 'delivered': return '#E2F4EC';
    case 'pending': return '#FBF0DA';
    case 'void-requested':
    case 'voided': return '#F7F7F9';
    default: return '#ECEBFF';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, marginTop: 6 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#0B0B12' },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F9',
    borderRadius: 12,
    padding: 3,
    gap: 2,
    marginTop: 16,
  },
  segBtn: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnActive: { backgroundColor: '#fff' },
  segText: { fontSize: 13.5, fontWeight: '600', color: '#6B6B76' },
  segTextActive: { color: '#0B0B12' },
  list: { gap: 12, marginTop: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pkgIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#ECEBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardItem: { fontSize: 15.5, fontWeight: '600', letterSpacing: -0.2 },
  cardCode: { fontSize: 12.5, color: '#9A9AA4', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },

  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12.5, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,10,20,0.07)',
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#9A9AA4',
  },
  footerValue: { fontSize: 13.5, fontWeight: '600', marginTop: 2, color: '#0B0B12' },
  footerAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
    color: '#0B0B12',
  },
});
