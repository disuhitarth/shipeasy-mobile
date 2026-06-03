import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { useShipment, useTracking, useVoidShipment } from '@/lib/queries';
import api from '@/lib/api';
import type { TrackingEvent } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  'label-created': '#635BFF',
  'picked-up': '#FF9500',
  'in-transit': '#007AFF',
  'out-for-delivery': '#FF9500',
  delivered: '#34C759',
  voided: '#FF3B30',
  failed: '#FF3B30',
};

const CAN_VOID = ['label-created', 'pending'];

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: shipment, isLoading } = useShipment(id);
  const { data: tracking, isLoading: trackLoading } = useTracking(id);
  const voidShipment = useVoidShipment();
  const [sharing, setSharing] = useState(false);

  const events: TrackingEvent[] = tracking?.events ?? tracking ?? [];
  const color = STATUS_COLORS[shipment?.status || ''] || '#9A9AA4';

  const openLabel = async () => {
    setSharing(true);
    try {
      const res = await api.get(`/shipments/${id}/label`, { responseType: 'arraybuffer' });
      const base64 = btoa(
        new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''),
      );
      const uri = FileSystem.documentDirectory + `label-${id}.pdf`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      } else {
        Alert.alert('Label saved', 'Label PDF saved to app storage');
      }
    } catch {
      Alert.alert('Error', 'Could not load label');
    } finally {
      setSharing(false);
    }
  };

  const voidLabel = () => {
    Alert.alert(
      'Void label',
      'Are you sure? This will refund the label cost to your wallet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void', style: 'destructive',
          onPress: async () => {
            try {
              await voidShipment.mutateAsync(id);
              Alert.alert('Voided', 'Label has been voided and refunded.');
              router.back();
            } catch {}
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#0B0B12" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>N° {id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#635BFF" style={{ marginTop: 60 }} />
        ) : shipment ? (
          <>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={styles.pkgIcon}>
                  <Ionicons name="cube" size={25} color="#635BFF" />
                </View>
                <View style={styles.heroInfo}>
                  <Text style={styles.heroItem}>
                    {shipment.items?.[0]?.description || 'Parcel'}
                  </Text>
                  <Text style={styles.heroMeta}>
                    {shipment.service || shipment.postageType || 'Standard'} · {shipment.weight}{shipment.weightUnit}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: color + '20' }]}>
                  <View style={[styles.badgeDot, { backgroundColor: color }]} />
                  <Text style={[styles.badgeText, { color }]}>{shipment.status}</Text>
                </View>
              </View>
              <View style={styles.route}>
                <View>
                  <Text style={styles.routeLabel}>FROM</Text>
                  <Text style={styles.routeCity}>Toronto</Text>
                </View>
                <View style={styles.routeLine}>
                  <View style={styles.routeTruck}>
                    <Ionicons name="car" size={14} color="#fff" />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.routeLabel}>TO</Text>
                  <Text style={styles.routeCity}>{shipment.recipientCity}</Text>
                </View>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={openLabel} disabled={sharing}>
                {sharing ? (
                  <ActivityIndicator size="small" color="#635BFF" />
                ) : (
                  <>
                    <Ionicons name="document-text" size={18} color="#635BFF" />
                    <Text style={styles.actionText}>View Label</Text>
                  </>
                )}
              </TouchableOpacity>
              {CAN_VOID.includes(shipment.status) && (
                <TouchableOpacity style={styles.actionBtn} onPress={voidLabel} disabled={voidShipment.isPending}>
                  {voidShipment.isPending ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={18} color="#FF3B30" />
                      <Text style={[styles.actionText, { color: '#FF3B30' }]}>Void</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Detail rows */}
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Shipment Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>{shipment.recipientName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {shipment.recipientAddress1}, {shipment.recipientCity},{' '}
                  {shipment.recipientProvinceCode} {shipment.recipientPostalCode}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tracking</Text>
                <Text style={styles.detailValue}>{shipment.trackingCode || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{shipment.service || shipment.postageType || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{shipment.weight}{shipment.weightUnit}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total charged</Text>
                <Text style={styles.detailValue}>${shipment.customerTotal?.toFixed(2)}</Text>
              </View>
            </View>

            {/* Tracking Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.detailTitle}>Tracking</Text>
              {trackLoading ? (
                <ActivityIndicator size="small" color="#635BFF" />
              ) : events.length > 0 ? (
                <View>
                  {events.map((ev, i) => {
                    const isLatest = i === 0;
                    return (
                      <View key={i} style={styles.tlRow}>
                        <View style={styles.tlNodeCol}>
                          <View style={[styles.tlNode, isLatest && { backgroundColor: color }]} />
                          {i < events.length - 1 && <View style={styles.tlLine} />}
                        </View>
                        <View style={{ flex: 1, paddingBottom: i < events.length - 1 ? 16 : 0 }}>
                          <Text style={[styles.tlText, !isLatest && styles.tlInactive]}>
                            {ev.description || ev.status}
                          </Text>
                          <View style={styles.tlMeta}>
                            {ev.date && <Text style={styles.tlSub}>{ev.date?.slice(0, 10)}</Text>}
                            {ev.location && <Text style={styles.tlSub}>{ev.location}</Text>}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noTrack}>No tracking updates yet</Text>
              )}
            </View>
          </>
        ) : (
          <Text style={styles.loading}>Shipment not found</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 60,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { flex: 1 },
  contentInner: { padding: 20, gap: 12 },
  loading: { color: '#9A9AA4', fontSize: 14, textAlign: 'center', marginTop: 40 },

  // Hero
  heroCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pkgIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#ECEBFF', alignItems: 'center', justifyContent: 'center' },
  heroInfo: { flex: 1 },
  heroItem: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  heroMeta: { fontSize: 13, color: '#9A9AA4', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 100 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12.5, fontWeight: '600' },
  route: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(10,10,20,0.07)' },
  routeLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.5, color: '#9A9AA4' },
  routeCity: { fontSize: 15, fontWeight: '600', marginTop: 2, letterSpacing: -0.2 },
  routeLine: { flex: 1, height: 2, backgroundColor: 'rgba(10,10,20,0.07)', position: 'relative' },
  routeTruck: { position: 'absolute', top: -7, left: '50%', marginLeft: -14, width: 28, height: 28, borderRadius: 14, backgroundColor: '#635BFF', alignItems: 'center', justifyContent: 'center' },

  // Actions
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 48, borderRadius: 14, backgroundColor: '#fff', padding: 14,
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#635BFF' },

  // Details
  detailCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18 },
  detailTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, letterSpacing: -0.3 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#6B6B76' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#0B0B12', flex: 1, textAlign: 'right' },

  // Timeline
  timelineCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18 },
  tlRow: { flexDirection: 'row', gap: 14 },
  tlNodeCol: { alignItems: 'center', width: 12 },
  tlNode: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D1D1D6', marginTop: 3 },
  tlLine: { width: 2, flex: 1, backgroundColor: '#E5E5EA', marginTop: 4 },
  tlText: { fontSize: 14, fontWeight: '600', color: '#0B0B12' },
  tlInactive: { color: '#9A9AA4' },
  tlMeta: { flexDirection: 'row', gap: 10, marginTop: 2 },
  tlSub: { fontSize: 12, color: '#9A9AA4' },
  noTrack: { fontSize: 14, color: '#9A9AA4', textAlign: 'center' },
});
