import { View, Text, StyleSheet, ScrollView, Alert, Animated, ActivityIndicator, Linking, Platform, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedRN, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useShipment, useVoidShipment } from '@/lib/queries';
import api from '@/lib/api';
import { bytesToBase64 } from '@/lib/base64';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { StaggeredItem } from '@/components/Staggered';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PressableCard, PressableScale } from '@/components/PressableScale';
import { LiveIndicator } from '@/components/LiveIndicator';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';
import { useTrackingPolling } from '@/lib/useTrackingPolling';
import { track } from '@/lib/analytics';
import { formatTimeAgo } from '@/lib/timeAgo';
import * as Haptics from '@/lib/haptics';
import type { TrackingEvent } from '@/types';
import { preventCapture, allowCapture } from '@/lib/screenCapture';
import { copySensitive } from '@/lib/clipboard';
import { toast } from '@/lib/toast';
import { LocalStore, SHIPMENT_TAGS, type ShippingTag } from '@/lib/localStore';
import { downloadReceipt } from '@/lib/receipts';

const CAN_VOID = ['label-created', 'pending'];
const SUPPORT_EMAIL = 'support@shipeasycanada.com';
const TRACK_BASE_URL = 'https://shipeasyplus.netlify.app/track';

const STATUS_NOTIFICATION_TITLES: Record<string, string> = {
  'picked-up': 'Package picked up',
  'in-transit': 'In transit',
  'out-for-delivery': 'Out for delivery',
  'delivered': 'Delivered!',
  'failed': 'Delivery failed',
  'voided': 'Label voided',
};

function PulseTag() {
  const opacity = useRef(new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity.current, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity.current, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.Text style={[styles.pulseTag, { opacity: opacity.current }]}>
      IN TRANSIT
    </Animated.Text>
  );
}

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: shipment, isLoading, isError, refetch } = useShipment(id);
  const {
    events,
    connectionStatus,
    lastFetchedAt,
    isFetching,
    refetch: refetchTracking,
  } = useTrackingPolling({ shipCode: id, intervalMs: 30_000 });
  const voidShipment = useVoidShipment();
  const [sharing, setSharing] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<ShippingTag[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [, setNow] = useState<number>(Date.now());
  const insets = useSafeAreaInsets();
  const lastStatusRef = useRef<string | null>(null);
  const notifiedSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const next = shipment?.status;
    if (!next) return;
    const prev = lastStatusRef.current;
    if (prev && prev !== next) {
      const key = `${next}:${shipment?.shipCode ?? ''}`;
      if (!notifiedSetRef.current.has(key) && STATUS_NOTIFICATION_TITLES[next]) {
        notifiedSetRef.current.add(key);
        try {
          if (Platform.OS !== 'web') {
            void Notifications.scheduleNotificationAsync({
              content: {
                title: STATUS_NOTIFICATION_TITLES[next],
                body: `Shipment ${shipment?.shipCode ?? ''} is now ${next.replace(/-/g, ' ')}.`,
                data: { type: 'shipment', shipCode: shipment?.shipCode, status: next },
                sound: 'default',
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
            });
            void track('notification_received', { source: 'tracking_poll', status: next });
          }
        } catch {}
      }
    }
    lastStatusRef.current = next;
  }, [shipment?.status, shipment?.shipCode]);

  useEffect(() => {
    void track('screen_view', { screen: 'shipment_detail', shipCode: id });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    Promise.all([
      LocalStore.getPinned(),
      LocalStore.getShipmentNote(id),
      LocalStore.getShipmentTags(id),
    ]).then(([p, n, t]) => {
      if (!alive) return;
      setPinned(p.includes(id));
      setNote(n);
      setTags(t);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      preventCapture('shipment-detail');
      return () => {
        allowCapture('shipment-detail');
      };
    }, []),
  );

  const copyTrackingNumber = useCallback(async () => {
    const code = shipment?.trackingCode || shipment?.shipCode || id;
    if (!code) return;
    Haptics.light();
    const ok = await copySensitive(String(code));
    if (ok) toast.info('Tracking number copied · clipboard clears in 60s');
  }, [shipment?.trackingCode, shipment?.shipCode, id]);

  const isDelivered = shipment?.status === 'delivered';
  const isInTransit = !isDelivered && !['voided', 'failed', 'pending'].includes(shipment?.status || '');

  const openLabel = async () => {
    Haptics.light();
    setSharing(true);
    try {
      const res = await api.get(`/shipments/${id}/label`, { responseType: 'arraybuffer' });
      const bytes = res.data instanceof Uint8Array ? res.data : new Uint8Array(res.data);
      const base64 = bytesToBase64(bytes);
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
    Haptics.warning();
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
              void track('shipment_voided', { shipCode: id });
              Haptics.success();
              Alert.alert('Voided', 'Label has been voided and refunded.');
              router.back();
            } catch {}
          },
        },
      ],
    );
  };

  const buildTrackingUrl = useCallback(() => {
    const code = shipment?.shipCode ?? id;
    return `${TRACK_BASE_URL}/${code}`;
  }, [shipment?.shipCode, id]);

  const shareTracking = useCallback(async () => {
    Haptics.light();
    const url = buildTrackingUrl();
    const message = `Track my ShipEasy package: ${url}`;
    try {
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(url, { dialogTitle: 'Share tracking link' }).catch(async () => {
          await Linking.openURL(`mailto:?subject=${encodeURIComponent('Track my package')}&body=${encodeURIComponent(message)}`);
        });
      } else {
        await Linking.openURL(`mailto:?subject=${encodeURIComponent('Track my package')}&body=${encodeURIComponent(message)}`);
      }
      void track('notification_tapped', { source: 'share_tracking' });
    } catch (err) {
      Alert.alert('Could not share', 'Please try again');
    }
  }, [buildTrackingUrl]);

  const reportIssue = useCallback(async () => {
    Haptics.light();
    const code = shipment?.shipCode ?? id;
    const recipient = shipment?.recipientName ?? 'Recipient';
    const subject = encodeURIComponent(`ShipEasy issue — ${code}`);
    const body = encodeURIComponent(
      [
        'Hi ShipEasy Support,',
        '',
        `I need help with shipment: ${code}`,
        `Recipient: ${recipient}`,
        '',
        'Issue description:',
        '',
        '---',
        'Additional details:',
        `Status: ${shipment?.status ?? 'unknown'}`,
        `Last tracking update: ${lastFetchedAt ? new Date(lastFetchedAt).toISOString() : 'never'}`,
        '---',
      ].join('\n'),
    );
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    try {
      const supported = await Linking.canOpenURL(mailto);
      if (supported) {
        await Linking.openURL(mailto);
      } else {
        Alert.alert('Email us', SUPPORT_EMAIL);
      }
      void track('error', { source: 'report_issue', shipCode: code });
    } catch {
      Alert.alert('Email us', SUPPORT_EMAIL);
    }
  }, [shipment?.shipCode, shipment?.recipientName, shipment?.status, id, lastFetchedAt]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}`;
  };

  const formatEstDelivery = () => {
    if (events.length > 0) {
      const d = new Date(events[events.length - 1].date);
      return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    return '2\u20135 business days';
  };

  const trackingTimestampLabel =
    lastFetchedAt ? `Updated ${formatTimeAgo(lastFetchedAt)}` : 'Waiting for first update';

  return (
    <AnimatedScreen direction="fade-up">
      <View style={styles.container}>
        <AnimatedRN.View entering={FadeInDown.duration(360)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <PressableScale style={styles.backBtn} onPress={() => router.back()} haptic="light">
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </PressableScale>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Shipment</Text>
            <LiveIndicator status={connectionStatus} lastFetchedAt={lastFetchedAt} compact />
          </View>
          <PressableScale style={styles.refreshBtn} onPress={() => { Haptics.light(); refetch(); void refetchTracking(); }} haptic="light">
            {isFetching ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="refresh" size={18} color={colors.ink} />
            )}
          </PressableScale>
        </AnimatedRN.View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : isError ? (
            <AnimatedRN.View entering={FadeInDown.duration(420)} style={styles.errorWrap}>
              <Ionicons name="cloud-offline-outline" size={48} color={colors.faint} />
              <Text style={styles.errorText}>Could not load shipment</Text>
              <PressableScale style={styles.retryBtn} onPress={() => refetch()} haptic="light">
                <Text style={styles.retryText}>Retry</Text>
              </PressableScale>
            </AnimatedRN.View>
          ) : !shipment ? (
            <AnimatedRN.View entering={FadeInDown.duration(420)} style={styles.errorWrap}>
              <Ionicons name="document-outline" size={48} color={colors.faint} />
              <Text style={styles.errorText}>Shipment not found</Text>
            </AnimatedRN.View>
          ) : (
            <>
              <AnimatedRN.View entering={FadeInDown.duration(420).delay(40)}>
                <StaggeredItem index={0} duration={360}>
                  <View style={styles.heroCard}>
                    <View style={styles.route}>
                      <View style={styles.routeEnd}>
                        <Text style={styles.routeLbl}>FROM</Text>
                        <Text style={styles.routeCity}>Toronto</Text>
                        <Text style={styles.routeProvince}>ON</Text>
                      </View>
                      <View style={styles.routeLineWrap}>
                        <View style={styles.routeLine} />
                        <View style={styles.routeTruck}>
                          <Ionicons name="car" size={13} color={colors.white} />
                        </View>
                      </View>
                      <View style={[styles.routeEnd, { alignItems: 'flex-end' }]}>
                        <Text style={styles.routeLbl}>TO</Text>
                        <Text style={styles.routeCity}>{shipment.recipientCity}</Text>
                        <Text style={styles.routeProvince}>{shipment.recipientProvinceCode}</Text>
                      </View>
                    </View>

                    <View style={styles.statusRow}>
                      <Badge status={shipment.status} />
                      {shipment.service && (
                        <Text style={styles.serviceLabel}>{shipment.service}</Text>
                      )}
                    </View>

                    {shipment.trackingCode && (
                      <TouchableOpacity
                        style={styles.trackRow}
                        onPress={copyTrackingNumber}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="barcode-outline" size={14} color={colors.faint} />
                        <Text style={styles.trackValue}>{shipment.trackingCode}</Text>
                        <Ionicons name="copy-outline" size={13} color={colors.faint} />
                      </TouchableOpacity>
                    )}
                  </View>
                </StaggeredItem>
              </AnimatedRN.View>

              <AnimatedRN.View entering={FadeInDown.duration(420).delay(80)}>
                <View style={styles.etaBanner}>
                  <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.etaTitle}>Estimated delivery</Text>
                    <Text style={styles.etaSub}>{formatEstDelivery()}</Text>
                  </View>
                  <LiveIndicator status={connectionStatus} lastFetchedAt={lastFetchedAt} compact />
                </View>
              </AnimatedRN.View>

              <AnimatedRN.View entering={FadeInDown.duration(420).delay(120)}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Shipment Details</Text>
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
                    <Text style={styles.detailLabel}>Package</Text>
                    <Text style={styles.detailValue}>{shipment.packageType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{shipment.weight}{shipment.weightUnit}</Text>
                  </View>
                  {(shipment.length || shipment.width || shipment.height) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Dimensions</Text>
                      <Text style={styles.detailValue}>
                        {[shipment.length, shipment.width, shipment.height].filter(Boolean).join(' \u00D7 ')}
                        {shipment.sizeUnit ? ` ${shipment.sizeUnit}` : ''}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Service</Text>
                    <Text style={styles.detailValue}>{shipment.service || shipment.postageType || '\u2014'}</Text>
                  </View>
                  {shipment.insured && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Insurance</Text>
                      <Text style={styles.detailValue}>Included</Text>
                    </View>
                  )}
                  {shipment.signatureConfirmation && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Signature</Text>
                      <Text style={styles.detailValue}>Required</Text>
                    </View>
                  )}
                  <View style={[styles.detailRow, styles.detailRowLast]}>
                    <Text style={styles.detailLabel}>Total charged</Text>
                    <Text style={styles.detailTotal}>${shipment.customerTotal?.toFixed(2)}</Text>
                  </View>
                </View>
              </AnimatedRN.View>

              {events.length > 0 && (
                <AnimatedRN.View entering={FadeInDown.duration(420).delay(160)}>
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Tracking</Text>
                      <LiveIndicator status={connectionStatus} lastFetchedAt={lastFetchedAt} compact />
                    </View>
                    <Text style={styles.trackingSub}>{trackingTimestampLabel}</Text>
                    <View style={styles.timeline}>
                      {events.map((ev, i) => {
                        const isLatest = i === 0;
                        const isLast = i === events.length - 1;
                        return (
                          <AnimatedRN.View
                            key={`${ev.date}-${i}`}
                            entering={FadeInDown.duration(360).delay(Math.min(i, 8) * 60)}
                            layout={LinearTransition.springify().damping(20).stiffness(220)}
                            style={styles.tlRow}
                          >
                            <View style={styles.tlRail}>
                              <View style={[styles.tlNode, isLatest && styles.tlNodeActive]} />
                              {!isLast && <View style={[styles.tlLine, isLatest && styles.tlLineActive]} />}
                            </View>
                            <View style={styles.tlBody}>
                              <Text style={[styles.tlDesc, !isLatest && styles.tlInactive]}>
                                {ev.description || ev.status}
                              </Text>
                              <View style={styles.tlMeta}>
                                {ev.location && (
                                  <View style={styles.tlLoc}>
                                    <Ionicons name="location-outline" size={11} color={colors.faint} />
                                    <Text style={styles.tlSub}>{ev.location}</Text>
                                  </View>
                                )}
                                {ev.date && <Text style={styles.tlSub}>{formatDate(ev.date)}</Text>}
                              </View>
                              {isLatest && isInTransit && <PulseTag />}
                            </View>
                          </AnimatedRN.View>
                        );
                      })}
                    </View>
                  </View>
                </AnimatedRN.View>
              )}

              <AnimatedRN.View entering={FadeInDown.duration(420).delay(200)}>
                <View style={styles.actionRow}>
                  <PressableCard style={styles.actionCard} onPress={shareTracking} haptic="light">
                    <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}>
                      <Ionicons name="share-outline" size={20} color={colors.accent} />
                    </View>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionTitle}>Share tracking</Text>
                      <Text style={styles.actionSub}>Send link to recipient</Text>
                    </View>
                  </PressableCard>
                  <PressableCard style={styles.actionCard} onPress={reportIssue} haptic="light">
                    <View style={[styles.actionIcon, { backgroundColor: colors.amberSoft }]}>
                      <Ionicons name="flag-outline" size={20} color={colors.amber} />
                    </View>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionTitle}>Report issue</Text>
                      <Text style={styles.actionSub}>Email our support team</Text>
                    </View>
                  </PressableCard>
                </View>
              </AnimatedRN.View>

              <AnimatedRN.View entering={FadeInDown.duration(420).delay(220)}>
                <PressableCard style={styles.labelRow} onPress={openLabel} disabled={sharing} haptic="light">
                  <View style={styles.labelIcon}>
                    <Ionicons name="document-text" size={22} color={colors.accent} />
                  </View>
                  <View style={styles.labelInfo}>
                    <Text style={styles.labelTitle}>Shipping Label</Text>
                    <Text style={styles.labelSub}>PDF \u00B7 {shipment.labelFormat || '4\u00D76'}</Text>
                  </View>
                  {sharing ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <View style={styles.labelCta}>
                      <Text style={styles.labelCtaText}>View</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                    </View>
                  )}
                </PressableCard>
              </AnimatedRN.View>

              {CAN_VOID.includes(shipment.status) && (
                <AnimatedRN.View entering={FadeInDown.duration(420).delay(240)}>
                  <PressableScale
                    style={styles.voidBtn}
                    onPress={voidLabel}
                    disabled={voidShipment.isPending}
                    haptic="warning"
                  >
                    {voidShipment.isPending ? (
                      <ActivityIndicator size="small" color={colors.red} />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={20} color={colors.red} />
                        <Text style={styles.voidText}>Void label</Text>
                      </>
                    )}
                  </PressableScale>
                </AnimatedRN.View>
              )}

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, color: colors.ink },
  scroll: { flex: 1 },
  scrollInner: { padding: spacing.xl, gap: spacing.md },
  loadingWrap: { gap: spacing.md, marginTop: 20 },
  errorWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  errorText: { fontSize: 15, color: colors.faint, fontWeight: '500' },
  retryBtn: {
    marginTop: 4, paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: borderRadius.sm, backgroundColor: colors.surface,
    ...shadows.sm,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: colors.accent },

  heroCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, ...shadows.md,
  },
  route: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeEnd: { flexShrink: 0 },
  routeLbl: {
    fontSize: 10.5, fontWeight: '600', letterSpacing: 0.5,
    color: colors.faint, textTransform: 'uppercase',
  },
  routeCity: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginTop: 2, color: colors.ink },
  routeProvince: { fontSize: 13, color: colors.muted, marginTop: 1 },
  routeLineWrap: { flex: 1, height: 2, position: 'relative', marginHorizontal: spacing.xs },
  routeLine: {
    height: 2, borderRadius: 1,
    borderStyle: 'dashed', borderWidth: 1, borderColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  routeTruck: {
    position: 'absolute', top: -13, left: '50%', marginLeft: -14,
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.lg, paddingTop: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.hairline,
  },
  serviceLabel: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  trackRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.sm,
  },
  trackValue: { fontSize: 13, fontWeight: '600', color: colors.muted, letterSpacing: 0.3 },

  etaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    padding: spacing.lg, borderRadius: borderRadius.sm,
    backgroundColor: colors.accentSoft,
  },
  etaTitle: { fontSize: 13, fontWeight: '600', color: colors.accent },
  etaSub: { fontSize: 12, color: colors.accent, opacity: 0.7, marginTop: 1 },

  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 18, fontWeight: '700', letterSpacing: -0.3,
    color: colors.ink,
  },
  trackingSub: {
    fontSize: 12,
    color: colors.faint,
    marginTop: -8,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.hairline2,
  },
  detailRowLast: { borderBottomWidth: 0, paddingTop: spacing.sm },
  detailLabel: { fontSize: 14, color: colors.muted, flex: 1 },
  detailValue: {
    fontSize: 14, fontWeight: '600', color: colors.ink,
    textAlign: 'right', maxWidth: '55%',
  },
  detailTotal: { fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'right' },

  timeline: { paddingLeft: 2 },
  tlRow: { flexDirection: 'row', gap: 14, paddingBottom: 0 },
  tlRail: { alignItems: 'center', width: 30, paddingTop: 2 },
  tlNode: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.hairline },
  tlNodeActive: { backgroundColor: colors.accent, width: 16, height: 16, borderRadius: 8 },
  tlLine: { width: 2, flex: 1, backgroundColor: colors.hairline, marginVertical: 4, minHeight: 24 },
  tlLineActive: { backgroundColor: colors.accent },
  tlBody: { flex: 1, paddingBottom: 26 },
  tlDesc: { fontSize: 14, fontWeight: '600', color: colors.ink },
  tlInactive: { color: colors.faint, fontWeight: '500' },
  tlMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  tlLoc: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tlSub: { fontSize: 12, color: colors.faint },
  pulseTag: {
    fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, marginTop: 6,
    color: colors.accent, backgroundColor: colors.accentSoft,
    paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6,
    overflow: 'hidden', alignSelf: 'flex-start',
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  actionIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  actionSub: { fontSize: 11.5, color: colors.faint, marginTop: 1 },

  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: spacing.lg, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, ...shadows.md,
  },
  labelIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  labelInfo: { flex: 1 },
  labelTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  labelSub: { fontSize: 12.5, color: colors.faint, marginTop: 1 },
  labelCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  labelCtaText: { fontSize: 14, fontWeight: '600', color: colors.accent },

  voidBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: borderRadius.sm,
    backgroundColor: colors.surface, ...shadows.md,
  },
  voidText: { fontSize: 15, fontWeight: '600', color: colors.red },
});
