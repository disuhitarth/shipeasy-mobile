import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, ActionSheetIOS, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useParseBatch, useParseImage, useGetRates, useCreateShipment } from '@/lib/queries';
import { useWallet } from '@/store/wallet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';
import { toast } from '@/lib/toast';
import type { AIParsedAddress } from '@/types';

type Step = 'input' | 'parsing' | 'review' | 'rates' | 'done';

interface AddressState extends AIParsedAddress {
  rateId?: string;
  ratePrice?: number;
  rateName?: string;
  loadingRate?: boolean;
  error?: string;
}

export default function BatchScreen() {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [addresses, setAddresses] = useState<AddressState[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [reveal, setReveal] = useState(0);
  const [buying, setBuying] = useState(false);
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<{ success: number; failed: number; total: number } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const balance = useWallet((s) => s.balance);
  const deduct = useWallet((s) => s.deduct);
  const parseBatch = useParseBatch();
  const parseImage = useParseImage();
  const getRates = useGetRates();
  const createShipment = useCreateShipment();

  const scrollRef = useRef<ScrollView>(null);

  const total = addresses.reduce((s, a) => s + (a.ratePrice || 0), 0);
  const ratedCount = addresses.filter((a) => a.rateId).length;
  const canAfford = balance >= total;

  const doParse = useCallback(async () => {
    if (!text.trim()) return;
    setParsing(true);
    setStep('parsing');
    setReveal(0);
    setParseError(null);
    try {
      const data = await parseBatch.mutateAsync(text);
      const parsed = data.addresses.map((a: AIParsedAddress) => ({
        ...a,
        weight: a.weight || 1,
        weight_unit: a.weight_unit || 'lb',
      }));
      parsed.forEach((_: any, i: number) => {
        setTimeout(() => setReveal(i + 1), 350 + i * 280);
      });
      setTimeout(() => {
        setAddresses(parsed);
        setNotes(data.processing_notes || []);
        setStep('review');
      }, 350 + parsed.length * 280 + 200);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse addresses');
      setStep('input');
    } finally {
      setParsing(false);
    }
  }, [text, parseBatch]);

  const doVision = useCallback(async () => {
    Haptics.light();
    if (Platform.OS === 'web') {
      toast.info('Camera not available on web');
      return;
    }
    const launch = async (source: 'camera' | 'library') => {
      try {
        if (source === 'camera') {
          const cam = await ImagePicker.requestCameraPermissionsAsync();
          if (!cam.granted) {
            toast.error('Camera permission required');
            return;
          }
        } else {
          const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!lib.granted) {
            toast.error('Photo library permission required');
            return;
          }
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: false,
          exif: false,
        });
        if (res.canceled || !res.assets?.[0]) return;
        const asset = res.assets[0];
        setStep('parsing');
        setReveal(0);
        setParseError(null);
        Haptics.success();
        const data = await parseImage.mutateAsync({
          uri: asset.uri,
          mimeType: asset.mimeType ?? 'image/jpeg',
          fileName: asset.fileName ?? undefined,
        });
        const list: AIParsedAddress[] = (data.addresses || []).map((a: AIParsedAddress) => ({
          ...a,
          weight: a.weight || 1,
          weight_unit: a.weight_unit || 'lb',
        }));
        list.forEach((_, i) => setTimeout(() => setReveal(i + 1), 350 + i * 280));
        setTimeout(() => {
          setAddresses(list);
          setNotes([`AI Vision extracted ${list.length} address${list.length !== 1 ? 'es' : ''} from image`]);
          setStep('review');
        }, 350 + list.length * 280 + 200);
      } catch (err: any) {
        setParseError(err?.message || 'Failed to read image');
        setStep('input');
      }
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (i) => {
          if (i === 1) launch('camera');
          else if (i === 2) launch('library');
        },
      );
    } else {
      Alert.alert('AI Vision', 'Pick a source', [
        { text: 'Take Photo', onPress: () => launch('camera') },
        { text: 'Choose from Library', onPress: () => launch('library') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [parseImage]);

  const rateAll = useCallback(async () => {
    setStep('rates');
    setAddresses((prev) => prev.map((a) => ({ ...a, loadingRate: true, error: undefined })));
    const results = await Promise.allSettled(
      addresses.map((a) =>
        getRates.mutateAsync({
          fromPostalCode: 'M5T2C9',
          toCountry: a.country_code || 'CA',
          toPostalCode: a.postal_code,
          weight: a.weight || 1,
          weightUnit: a.weight_unit || 'lb',
          length: a.length || undefined,
          width: a.width || undefined,
          height: a.height || undefined,
        })
      )
    );
    setAddresses((prev) => prev.map((a, i) => {
      const r = results[i];
      if (r.status === 'fulfilled') {
        const eco = r.value.rates.find((rt: any) => rt.id === 'ECO');
        return { ...a, loadingRate: false, rateId: eco?.id, ratePrice: eco?.totalPrice, rateName: eco?.name, error: undefined };
      }
      return { ...a, loadingRate: false, error: 'Rate lookup failed' };
    }));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [addresses, getRates]);

  const buyAll = useCallback(async () => {
    setBuying(true);
    let success = 0;
    for (const a of addresses) {
      if (!a.rateId) continue;
      try {
        const ship = await createShipment.mutateAsync({
          recipientName: a.name,
          recipientAddress1: a.address1,
          recipientCity: a.city,
          recipientProvinceCode: a.province_code,
          recipientPostalCode: a.postal_code,
          recipientCountryCode: a.country_code || 'CA',
          weight: a.weight || 1,
          weightUnit: a.weight_unit || 'lb',
          packageType: 'parcel',
          postageType: a.rateId,
        });
        deduct(ship.customerTotal || 0);
        success++;
      } catch {
        // individual shipment failure — continue to next
      }
    }
    setResults({ success, failed: addresses.length - success, total: addresses.length });
    setStep('done');
    setBuying(false);
  }, [addresses, createShipment, deduct]);

  const removeAddress = useCallback((i: number) => {
    setAddresses((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  if (step === 'done' && results) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(360)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <PressableScale style={styles.backBtn} onPress={() => router.replace('/(tabs)')} haptic="light">
            <Ionicons name="close" size={18} color={colors.ink} />
          </PressableScale>
          <View style={styles.headerCenter}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Text style={styles.headerTitle}>Batch complete</Text>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>
        <View style={styles.doneWrap}>
          <Animated.View entering={ZoomIn.duration(560).springify().damping(14)}>
            <LinearGradient colors={[colors.greenSoft, 'transparent']} style={styles.successRing}>
              <Ionicons name="checkmark-circle" size={80} color={colors.green} />
            </LinearGradient>
          </Animated.View>
          <Animated.Text entering={FadeInUp.duration(360).delay(160)} style={styles.doneTitle}>
            {results.success} of {results.total} labels purchased
          </Animated.Text>
          <Animated.Text entering={FadeInUp.duration(360).delay(240)} style={styles.doneSub}>
            Charged ${total.toFixed(2)} from your wallet
          </Animated.Text>
          {results.failed > 0 && (
            <Animated.Text entering={FadeInUp.duration(360).delay(300)} style={styles.doneFail}>
              {results.failed} label{results.failed !== 1 ? 's' : ''} failed
            </Animated.Text>
          )}
          <Animated.View entering={FadeInUp.duration(360).delay(360)} style={{ marginTop: spacing['2xl'] }}>
            <Button onPress={() => router.replace('/(tabs)/shipments')} haptic="success" full>
              View shipments
            </Button>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(360)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale style={styles.backBtn} onPress={() => router.back()} haptic="light">
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </PressableScale>
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={16} color={colors.accent} />
          <Text style={styles.headerTitle}>Magic Batch</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(360).delay(60)} style={styles.progress}>
        <View style={[styles.seg, step !== 'input' && step !== 'parsing' && styles.segDone]} />
        <View style={[styles.seg, step === 'rates' && styles.segDone]} />
        <View style={[styles.seg, step === 'rates' && styles.segActive]} />
      </Animated.View>

      {step === 'input' && (
        <>
          <Animated.View entering={FadeInUp.duration(360).delay(120)} style={styles.hero}>
            <Text style={styles.heroTitle}>Paste & go</Text>
            <Text style={styles.heroSub}>
              Drop in messy text — AI sorts every address into ready-to-ship rows.
            </Text>
          </Animated.View>

          {parseError && (
            <Animated.View entering={FadeInDown.duration(360)} style={styles.parseError}>
              <Ionicons name="cloud-offline-outline" size={18} color={colors.red} />
              <Text style={styles.parseErrorText}>{parseError}</Text>
            </Animated.View>
          )}

          <ScrollView style={styles.inputArea} keyboardShouldPersistTaps="handled" ref={scrollRef}>
            <TextInput
              style={styles.textarea}
              multiline
              placeholderTextColor={colors.faint}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
              placeholder="e.g.
              Priya — 1450 Howe St, Vancouver BC
              Tom / 815 1 St SW, Calgary AB …"
            />
            <View style={styles.inputActions}>
              <PressableScale
                style={styles.ghostLink}
                onPress={() => { Haptics.light(); setText('Priya Sharma — 1450 Howe St, Vancouver BC V6Z 1R8\nLéa Tremblay — 4200 Rue Saint-Denis, Montréal QC H2J 2L1\nTom Becker — 815 1 St SW, Calgary AB T2P 1N3\nGrace Liu — 1741 Lower Water St, Halifax NS B3J 1S5\nDaniel O\'Connor — 90 Eglinton Ave E, Toronto ON M4P 2Y3'); }}
                haptic="light"
              >
                <Ionicons name="copy-outline" size={15} color={colors.accent} />
                <Text style={styles.ghostLinkText}>Paste sample</Text>
              </PressableScale>
              <PressableScale style={styles.visionBtn} onPress={doVision} haptic="light">
                <Ionicons name="scan" size={17} color={colors.accent} />
                <Text style={styles.visionBtnText}>AI Vision</Text>
              </PressableScale>
            </View>
          </ScrollView>

          <Animated.View entering={FadeInUp.duration(360).delay(160)} style={styles.footer}>
            <View style={styles.hintRow}>
              <Ionicons name="sparkles" size={14} color={colors.accent} />
              <Text style={styles.hint}>AI-powered address parsing</Text>
            </View>
            <Button
              full
              disabled={!text.trim() || parsing}
              loading={parsing}
              onPress={doParse}
              haptic="success"
            >
              Parse with AI
            </Button>
          </Animated.View>
        </>
      )}

      {step === 'parsing' && (
        <>
          <Animated.View entering={FadeInDown.duration(360)} style={styles.parsingHead}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.parsingText}>AI parsing addresses…</Text>
          </Animated.View>
          <ScrollView style={styles.addrList} contentContainerStyle={styles.addrListInner}>
            {addresses.slice(0, Math.max(reveal, 5)).map((a, i) => (
              i < reveal ? (
                <Animated.View
                  key={i}
                  entering={FadeInDown.duration(360)}
                  style={styles.parsedRow}
                >
                  <View style={styles.batchNum}>
                    <Text style={styles.batchNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.parsedName}>{a.name}</Text>
                    <Text style={styles.parsedLine} numberOfLines={1}>{a.address1}, {a.city} {a.province_code}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                </Animated.View>
              ) : (
                <View key={i} style={styles.parsedRow}>
                  <View style={[styles.batchNum, { backgroundColor: colors.surface2 }]} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.skelLine} />
                    <View style={[styles.skelLine, { width: '70%' }]} />
                  </View>
                </View>
              )
            ))}
          </ScrollView>
          <Animated.View entering={FadeInUp.duration(360)} style={styles.footer}>
            <Button full disabled loading>
              Parsing addresses…
            </Button>
          </Animated.View>
        </>
      )}

      {(step === 'review' || step === 'rates') && (
        <>
          <Animated.View entering={FadeInUp.duration(360).delay(80)} style={styles.batchSummary}>
            <View style={styles.batchSummaryRow}>
              <View>
                <Text style={styles.batchCount}>{addresses.length} shipment{addresses.length !== 1 ? 's' : ''}</Text>
                <Text style={styles.batchStatus}>{step === 'rates' ? 'Rated · tax included' : 'Parsed & verified'}</Text>
              </View>
              <View style={styles.parsedPill}>
                <Ionicons name="checkmark-circle" size={13} color={colors.green} />
                <Text style={styles.parsedPillText}>AI verified</Text>
              </View>
            </View>
            {notes.map((n, i) => (
              <View key={i} style={styles.noteRow}>
                <Ionicons name="information-circle" size={14} color={colors.accent} />
                <Text style={styles.noteText}>{n}</Text>
              </View>
            ))}
          </Animated.View>

          <ScrollView style={styles.addrList} contentContainerStyle={styles.addrListInner} ref={scrollRef}>
            {addresses.map((a, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.duration(360).delay(120 + i * 60)}
              >
                <Card padding={16} style={{ gap: 10 }}>
                  <View style={styles.addrCardHeader}>
                    <View style={styles.batchNum}>
                      <Text style={styles.batchNumText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.addrName}>{a.name}</Text>
                      <Text style={styles.addrLine}>
                        {a.address1}{a.address2 ? `, ${a.address2}` : ''}
                      </Text>
                      <Text style={styles.addrLine}>
                        {a.city}, {a.province_code} {a.postal_code}
                      </Text>
                    </View>
                    <PressableScale
                      onPress={() => { Haptics.light(); removeAddress(i); }}
                      style={styles.removeBtn}
                      haptic="light"
                      scaleTo={0.85}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.red} />
                    </PressableScale>
                  </View>

                  <View style={styles.addrMeta}>
                    <Ionicons name="cube-outline" size={14} color={colors.faint} />
                    <Text style={styles.addrMetaText}>
                      {a.weight || 1} {a.weight_unit || 'lb'}
                    </Text>
                    {a.detected_product && (
                      <>
                        <View style={styles.metaDot} />
                        <Ionicons name="pricetag-outline" size={14} color={colors.faint} />
                        <Text style={styles.addrMetaText}>{a.detected_product}</Text>
                      </>
                    )}
                    {a.detected_quantity && (
                      <>
                        <View style={styles.metaDot} />
                        <Ionicons name="layers-outline" size={14} color={colors.faint} />
                        <Text style={styles.addrMetaText}>×{a.detected_quantity}</Text>
                      </>
                    )}
                  </View>

                  <View style={styles.confRow}>
                    <View style={styles.confBar}>
                      <View style={[styles.confFill, { width: `${a.confidence}%` }]} />
                    </View>
                    <Text style={styles.confText}>{a.confidence}%</Text>
                  </View>

                  {step === 'rates' && (
                    <View style={styles.rateRow}>
                      {a.loadingRate ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color={colors.accent} />
                          <Text style={{ fontSize: 13, color: colors.faint }}>Getting rates…</Text>
                        </View>
                      ) : a.error ? (
                        <Text style={styles.rateError}>{a.error}</Text>
                      ) : a.ratePrice ? (
                        <Text style={styles.rateValue}>
                          {a.rateName}: <Text style={styles.ratePrice}>${a.ratePrice.toFixed(2)}</Text>
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 13, color: colors.faint }}>Awaiting rates…</Text>
                      )}
                    </View>
                  )}
                </Card>
              </Animated.View>
            ))}
          </ScrollView>

          <Animated.View entering={FadeInUp.duration(360).delay(120)} style={styles.footer}>
            {step === 'review' && (
              <Button full onPress={rateAll} haptic="medium">
                {'Get rates for all ' + addresses.length}
              </Button>
            )}
            {step === 'rates' && (
              <>
                <View style={styles.footTotal}>
                  <Text style={styles.footTotalLabel}>{addresses.length} label{addresses.length !== 1 ? 's' : ''} · incl. tax</Text>
                  <Text style={styles.footTotalValue}>${total.toFixed(2)}</Text>
                </View>
                <Button
                  full
                  disabled={!canAfford || ratedCount === 0}
                  loading={buying}
                  onPress={buyAll}
                  haptic="success"
                >
                  {!canAfford
                    ? 'Insufficient balance'
                    : ratedCount === 0
                    ? 'No rates available'
                    : `Pay & generate ${ratedCount}`}
                </Button>
              </>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg,
  },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },

  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.hairline },
  segDone: { backgroundColor: colors.accent },
  segActive: { backgroundColor: colors.accent, opacity: 0.5 },

  hero: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  heroTitle: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6, color: colors.ink },
  heroSub: { fontSize: 14.5, color: colors.muted, marginTop: spacing.xs },

  inputArea: { flex: 1, paddingHorizontal: spacing.xl },
  textarea: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.lg,
    fontSize: 15, lineHeight: 22, color: colors.ink,
    borderWidth: 1, borderColor: colors.hairline,
    fontFamily: 'ui-monospace',
  },
  inputActions: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginTop: spacing.md, marginBottom: spacing.xs,
  },
  ghostLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12 },
  ghostLinkText: { fontSize: 14, fontWeight: '600', color: colors.accent },
  visionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: colors.accentSoft, borderRadius: borderRadius.full,
  },
  visionBtnText: { fontSize: 14, fontWeight: '600', color: colors.accent },

  footer: {
    padding: spacing.xl, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  hint: { fontSize: 12, color: colors.faint },

  parseError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.redSoft,
    borderRadius: borderRadius.sm,
  },
  parseErrorText: { fontSize: 13, color: colors.red, flex: 1, fontWeight: '500' },

  parsingHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  parsingText: { fontSize: 14.5, fontWeight: '600', color: colors.ink },

  batchSummary: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  batchSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  batchCount: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4, color: colors.ink },
  batchStatus: { fontSize: 12.5, color: colors.faint, marginTop: 2 },
  parsedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.greenSoft, paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: borderRadius.full,
  },
  parsedPillText: { fontSize: 12.5, fontWeight: '600', color: colors.green },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  noteText: { fontSize: 12.5, color: colors.accent, flex: 1 },

  addrList: { flex: 1 },
  addrListInner: { padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },

  parsedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.hairline,
  },
  parsedName: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  parsedLine: { fontSize: 12.5, color: colors.faint, marginTop: 1 },

  batchNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  batchNumText: { fontSize: 13, fontWeight: '700', color: colors.accent },

  skelLine: { height: 12, borderRadius: 6, backgroundColor: colors.surface2 },

  addrCardHeader: { flexDirection: 'row', gap: 12 },
  addrName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  addrLine: { fontSize: 13.5, color: colors.muted, marginTop: 1 },
  removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  addrMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.hairline,
  },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.hairline },
  addrMetaText: { fontSize: 12.5, color: colors.muted },

  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.hairline },
  confFill: { height: 4, borderRadius: 2, backgroundColor: colors.green },
  confText: { fontSize: 11, color: colors.faint, fontWeight: '500', width: 36, textAlign: 'right' },

  rateRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.hairline, minHeight: 32 },
  rateError: { fontSize: 13, color: colors.red },
  rateValue: { fontSize: 14, fontWeight: '500', color: colors.ink },
  ratePrice: { fontWeight: '700', color: colors.accent },

  footTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  footTotalLabel: { fontSize: 12.5, fontWeight: '600', color: colors.faint },
  footTotalValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, color: colors.ink },

  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successRing: { marginBottom: spacing.lg },
  doneTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4, color: colors.ink, textAlign: 'center' },
  doneSub: { fontSize: 15, color: colors.muted, marginTop: spacing.sm, textAlign: 'center' },
  doneFail: { fontSize: 14, color: colors.red, marginTop: spacing.xs, textAlign: 'center' },
});
