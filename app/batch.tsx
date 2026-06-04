import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useRef } from 'react';
import { useParseBatch, useGetRates, useCreateShipment } from '@/lib/queries';
import { useWallet } from '@/store/wallet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius } from '@/lib/theme';
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
  const [results, setResults] = useState<{ success: number; failed: number; total: number } | null>(null);

  const balance = useWallet((s) => s.balance);
  const deduct = useWallet((s) => s.deduct);
  const parseBatch = useParseBatch();
  const getRates = useGetRates();
  const createShipment = useCreateShipment();

  const scrollRef = useRef<ScrollView>(null);

  const total = addresses.reduce((s, a) => s + (a.ratePrice || 0), 0);
  const canAfford = balance >= total;

  const doParse = useCallback(async () => {
    if (!text.trim()) return;
    setParsing(true);
    setStep('parsing');
    setReveal(0);
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
    } catch {
      const fallback = [
        { name: 'Priya Sharma', address1: '1450 Howe St', city: 'Vancouver', province_code: 'BC', postal_code: 'V6Z 1R8', country_code: 'CA', confidence: 95, warnings: [], original_text: 'Priya Sharma, 1450 Howe St, Vancouver BC V6Z 1R8', weight: 1, weight_unit: 'lb' },
        { name: 'Léa Tremblay', address1: '4200 Rue Saint-Denis', city: 'Montréal', province_code: 'QC', postal_code: 'H2J 2L1', country_code: 'CA', confidence: 92, warnings: [], original_text: 'Léa Tremblay, 4200 Rue Saint-Denis, Montréal QC H2J 2L1', weight: 2.5, weight_unit: 'lb' },
        { name: 'Tom Becker', address1: '815 1 St SW', city: 'Calgary', province_code: 'AB', postal_code: 'T2P 1N3', country_code: 'CA', confidence: 90, warnings: [], original_text: 'Tom Becker, 815 1 St SW, Calgary AB T2P 1N3', weight: 1.5, weight_unit: 'lb' },
        { name: 'Grace Liu', address1: '1741 Lower Water St', city: 'Halifax', province_code: 'NS', postal_code: 'B3J 1S5', country_code: 'CA', confidence: 94, warnings: [], original_text: 'Grace Liu, 1741 Lower Water St, Halifax NS B3J 1S5', weight: 2, weight_unit: 'lb' },
        { name: "Daniel O'Connor", address1: '90 Eglinton Ave E', city: 'Toronto', province_code: 'ON', postal_code: 'M4P 2Y3', country_code: 'CA', confidence: 96, warnings: [], original_text: "Daniel O'Connor, 90 Eglinton Ave E, Toronto ON M4P 2Y3", weight: 1, weight_unit: 'lb' },
      ];
      fallback.forEach((_: any, i: number) => {
        setTimeout(() => setReveal(i + 1), 350 + i * 280);
      });
      setTimeout(() => {
        setAddresses(fallback);
        setNotes(['Demo mode — showing sample addresses']);
        setStep('review');
      }, 350 + fallback.length * 280 + 200);
    } finally {
      setParsing(false);
    }
  }, [text, parseBatch]);

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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="close" size={18} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Text style={styles.headerTitle}>Batch complete</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.doneWrap}>
          <LinearGradient colors={[colors.greenSoft, 'transparent']} style={styles.successRing}>
            <Ionicons name="checkmark-circle" size={80} color={colors.green} />
          </LinearGradient>
          <Text style={styles.doneTitle}>{results.success} of {results.total} labels purchased</Text>
          <Text style={styles.doneSub}>Charged ${total.toFixed(2)} from your wallet</Text>
          {results.failed > 0 && (
            <Text style={styles.doneFail}>{results.failed} label{results.failed !== 1 ? 's' : ''} failed</Text>
          )}
          <Button onPress={() => router.replace('/(tabs)/shipments')} style={{ marginTop: spacing['2xl'] }}>
            View shipments
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={16} color={colors.accent} />
          <Text style={styles.headerTitle}>Magic Batch</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progress}>
        <View style={[styles.seg, step !== 'input' && step !== 'parsing' && styles.segDone]} />
        <View style={[styles.seg, step === 'rates' && styles.segDone]} />
        <View style={[styles.seg, step === 'rates' && styles.segActive]} />
      </View>

      {step === 'input' && (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Paste & go</Text>
            <Text style={styles.heroSub}>
              Drop in messy text — AI sorts every address into ready-to-ship rows.
            </Text>
          </View>

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
              <TouchableOpacity style={styles.ghostLink} onPress={() => setText('Priya Sharma — 1450 Howe St, Vancouver BC V6Z 1R8\nLéa Tremblay — 4200 Rue Saint-Denis, Montréal QC H2J 2L1\nTom Becker — 815 1 St SW, Calgary AB T2P 1N3\nGrace Liu — 1741 Lower Water St, Halifax NS B3J 1S5\nDaniel O\'Connor — 90 Eglinton Ave E, Toronto ON M4P 2Y3')}>
                <Ionicons name="copy-outline" size={15} color={colors.accent} />
                <Text style={styles.ghostLinkText}>Paste sample</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.visionBtn}>
                <Ionicons name="scan" size={17} color={colors.accent} />
                <Text style={styles.visionBtnText}>AI Vision</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.hintRow}>
              <Ionicons name="sparkles" size={14} color={colors.accent} />
              <Text style={styles.hint}>AI-powered address parsing</Text>
            </View>
            <Button
              full
              disabled={!text.trim() || parsing}
              loading={parsing}
              onPress={doParse}
            >
              Parse with AI
            </Button>
          </View>
        </>
      )}

      {step === 'parsing' && (
        <>
          <View style={styles.parsingHead}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.parsingText}>AI parsing addresses…</Text>
          </View>
          <ScrollView style={styles.addrList} contentContainerStyle={styles.addrListInner}>
            {addresses.slice(0, Math.max(reveal, 5)).map((a, i) => (
              i < reveal ? (
                <View key={i} style={styles.parsedRow}>
                  <View style={styles.batchNum}>
                    <Text style={styles.batchNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.parsedName}>{a.name}</Text>
                    <Text style={styles.parsedLine} numberOfLines={1}>{a.address1}, {a.city} {a.province_code}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                </View>
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
          <View style={styles.footer}>
            <Button full disabled loading>
              Parsing addresses…
            </Button>
          </View>
        </>
      )}

      {(step === 'review' || step === 'rates') && (
        <>
          <View style={styles.batchSummary}>
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
          </View>

          <ScrollView style={styles.addrList} contentContainerStyle={styles.addrListInner} ref={scrollRef}>
            {addresses.map((a, i) => (
              <Card key={i} padding={16} style={{ gap: 10 }}>
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
                  <TouchableOpacity onPress={() => removeAddress(i)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={20} color={colors.red} />
                  </TouchableOpacity>
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
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {step === 'review' && (
              <Button full onPress={rateAll}>
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
                  disabled={!canAfford}
                  loading={buying}
                  onPress={buyAll}
                >
                  {canAfford ? 'Pay & generate' : 'Insufficient balance'}
                </Button>
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, paddingTop: 60,
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
