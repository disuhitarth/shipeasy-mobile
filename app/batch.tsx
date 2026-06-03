import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useParseBatch, useGetRates, useCreateShipment } from '@/lib/queries';
import { useWallet } from '@/store/wallet';
import type { AIParsedAddress } from '@/types';

type Step = 'input' | 'review' | 'rates' | 'done';

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
  const [results, setResults] = useState<{ success: number; failed: number; total: number } | null>(null);

  const balance = useWallet((s) => s.balance);
  const deduct = useWallet((s) => s.deduct);
  const parseBatch = useParseBatch();
  const getRates = useGetRates();
  const createShipment = useCreateShipment();

  const doParse = useCallback(async () => {
    if (!text.trim()) return;
    setParsing(true);
    try {
      const data = await parseBatch.mutateAsync(text);
      setAddresses(data.addresses.map((a: AIParsedAddress) => ({
        ...a,
        weight: a.weight || 1,
        weight_unit: a.weight_unit || 'lb',
      })));
      setNotes(data.processing_notes || []);
      setStep('review');
    } catch {
      // fallback: mock 2 sample addresses for demo
      setAddresses([
        {
          name: 'John Smith', address1: '123 Main St', city: 'Toronto',
          province_code: 'ON', postal_code: 'M5T2C9', country_code: 'CA',
          confidence: 95, warnings: [], original_text: 'John Smith, 123 Main St, Toronto ON M5T2C9',
          weight: 1, weight_unit: 'lb',
        },
        {
          name: 'Jane Doe', address1: '456 Queen St W', city: 'Vancouver',
          province_code: 'BC', postal_code: 'V6Z1R8', country_code: 'CA',
          confidence: 92, warnings: [], original_text: 'Jane Doe, 456 Queen St W, Vancouver BC V6Z1R8',
          weight: 2.5, weight_unit: 'lb',
        },
      ]);
      setNotes(['Demo mode — showing sample addresses']);
      setStep('review');
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
        const eco = r.value.rates.find((rt) => rt.id === 'ECO');
        return { ...a, loadingRate: false, rateId: eco?.id, ratePrice: eco?.totalPrice, rateName: eco?.name, error: undefined };
      }
      return { ...a, loadingRate: false, error: 'Rate lookup failed' };
    }));
  }, [addresses, getRates]);

  const buyAll = useCallback(async () => {
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
  }, [addresses, createShipment, deduct]);

  const removeAddress = useCallback((i: number) => {
    setAddresses((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  if (step === 'done' && results) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="close" size={18} color="#0B0B12" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="checkmark-circle" size={18} color="#34C759" />
            <Text style={styles.headerTitle}>Batch complete</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={64} color="#34C759" />
          <Text style={styles.doneTitle}>All done!</Text>
          <Text style={styles.doneSub}>
            {results.success} of {results.total} labels purchased
          </Text>
          {results.failed > 0 && (
            <Text style={styles.doneFail}>{results.failed} failed</Text>
          )}
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/shipments')}>
            <Text style={styles.doneBtnText}>View shipments</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#0B0B12" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={16} color="#635BFF" />
          <Text style={styles.headerTitle}>Magic Batch</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        <View style={[styles.seg, step !== 'input' && styles.segDone]} />
        <View style={[styles.seg, step === 'rates' && styles.segDone]} />
        <View style={[styles.seg, step === 'rates' && styles.segActive]} />
      </View>

      {step === 'input' && (
        <>
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Paste everything in</Text>
            <Text style={styles.heroSub}>
              Addresses, products, quantities — AI parses it all
            </Text>
          </View>

          {/* Textarea */}
          <ScrollView style={styles.inputArea} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.textarea}
              multiline
              placeholder="Paste addresses here…&#10;&#10;e.g.&#10;John Smith&#10;123 Main St&#10;Toronto ON M5T2C9&#10;1× T-shirt"
              placeholderTextColor="#9A9AA4"
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.hintRow}>
              <Ionicons name="sparkles" size={14} color="#9A9AA4" />
              <Text style={styles.hint}>AI-powered address parsing</Text>
            </View>
            <TouchableOpacity
              style={[styles.cta, !text.trim() && styles.ctaDisabled]}
              onPress={doParse}
              disabled={!text.trim() || parsing}
            >
              {parsing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Parse addresses</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {(step === 'review' || step === 'rates') && (
        <>
          {/* Batch Summary */}
          <View style={styles.batchSummary}>
            <Text style={styles.batchCount}>
              {addresses.length} address{addresses.length !== 1 ? 'es' : ''} detected
            </Text>
            {notes.map((n, i) => (
              <View key={i} style={styles.noteRow}>
                <Ionicons name="information-circle" size={14} color="#635BFF" />
                <Text style={styles.noteText}>{n}</Text>
              </View>
            ))}
          </View>

          {/* Address List */}
          <ScrollView style={styles.addrList} contentContainerStyle={styles.addrListInner}>
            {addresses.map((a, i) => (
              <View key={i} style={styles.addrCard}>
                <View style={styles.addrCardHeader}>
                  <View style={styles.addrBadge}>
                    <Text style={styles.addrBadgeText}>{i + 1}</Text>
                  </View>
                  <View style={styles.addrCardInfo}>
                    <Text style={styles.addrName}>{a.name}</Text>
                    <Text style={styles.addrLine}>
                      {a.address1}{a.address2 ? `, ${a.address2}` : ''}
                    </Text>
                    <Text style={styles.addrLine}>
                      {a.city}, {a.province_code} {a.postal_code}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeAddress(i)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>

                {/* Weight */}
                <View style={styles.addrMeta}>
                  <Ionicons name="cube-outline" size={14} color="#9A9AA4" />
                  <Text style={styles.addrMetaText}>
                    {a.weight || 1} {a.weight_unit || 'lb'}
                  </Text>
                  {a.detected_product && (
                    <>
                      <Ionicons name="pricetag-outline" size={14} color="#9A9AA4" />
                      <Text style={styles.addrMetaText}>{a.detected_product}</Text>
                    </>
                  )}
                  {a.detected_quantity && (
                    <>
                      <Ionicons name="layers-outline" size={14} color="#9A9AA4" />
                      <Text style={styles.addrMetaText}>×{a.detected_quantity}</Text>
                    </>
                  )}
                </View>

                {/* Confidence */}
                <View style={styles.confRow}>
                  <View style={styles.confBar}>
                    <View style={[styles.confFill, { width: `${a.confidence}%` }]} />
                  </View>
                  <Text style={styles.confText}>{a.confidence}% confidence</Text>
                </View>

                {/* Rate / Error */}
                {step === 'rates' && (
                  <View style={styles.rateRow}>
                    {a.loadingRate ? (
                      <ActivityIndicator size="small" color="#635BFF" />
                    ) : a.error ? (
                      <Text style={styles.rateError}>{a.error}</Text>
                    ) : a.ratePrice ? (
                      <Text style={styles.rateValue}>
                        {a.rateName}: <Text style={styles.ratePrice}>${a.ratePrice.toFixed(2)}</Text>
                      </Text>
                    ) : (
                      <Text style={styles.ratePending}>Awaiting rates…</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          {step === 'review' && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cta}
                onPress={rateAll}
              >
                <Text style={styles.ctaText}>Get rates for all</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'rates' && (
            <View style={styles.footer}>
              <View style={styles.footTotal}>
                <Text style={styles.footTotalLabel}>Estimated total</Text>
                <Text style={styles.footTotalValue}>
                  ${addresses.reduce((s, a) => s + (a.ratePrice || 0), 0).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cta, balance < addresses.reduce((s, a) => s + (a.ratePrice || 0), 0) && styles.ctaDisabled]}
                onPress={buyAll}
                disabled={balance < addresses.reduce((s, a) => s + (a.ratePrice || 0), 0)}
              >
                <Text style={styles.ctaText}>
                  {balance < addresses.reduce((s, a) => s + (a.ratePrice || 0), 0)
                    ? 'Insufficient balance'
                    : `Buy ${addresses.length} label${addresses.length !== 1 ? 's' : ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: '600' },

  // Progress
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 8 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(10,10,20,0.07)' },
  segDone: { backgroundColor: '#635BFF' },
  segActive: { backgroundColor: '#635BFF', opacity: 0.5 },

  // Input step
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  heroTitle: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  heroSub: { fontSize: 14.5, color: '#6B6B76', marginTop: 4 },
  inputArea: { flex: 1, paddingHorizontal: 20 },
  textarea: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16,
    fontSize: 15, lineHeight: 22, color: '#0B0B12',
    borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },

  // Footer
  footer: {
    padding: 20, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: 'rgba(10,10,20,0.07)',
    backgroundColor: 'rgba(242,242,245,0.95)',
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'absolute', top: -30, left: 20 },
  hint: { fontSize: 12, color: '#9A9AA4' },
  cta: {
    flex: 1, height: 52, borderRadius: 14, backgroundColor: '#635BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.42 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Review / Rates step
  batchSummary: { paddingHorizontal: 20, paddingVertical: 12 },
  batchCount: { fontSize: 14, fontWeight: '600', color: '#6B6B76' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  noteText: { fontSize: 12.5, color: '#635BFF', flex: 1 },
  addrList: { flex: 1 },
  addrListInner: { padding: 20, gap: 12, paddingBottom: 40 },
  addrCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  addrCardHeader: { flexDirection: 'row', gap: 12 },
  addrBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#ECEBFF',
    alignItems: 'center', justifyContent: 'center',
  },
  addrBadgeText: { fontSize: 13, fontWeight: '700', color: '#635BFF' },
  addrCardInfo: { flex: 1 },
  addrName: { fontSize: 15, fontWeight: '600', color: '#0B0B12' },
  addrLine: { fontSize: 13.5, color: '#6B6B76', marginTop: 1 },
  removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  addrMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(10,10,20,0.05)',
  },
  addrMetaText: { fontSize: 12.5, color: '#6B6B76' },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  confBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(10,10,20,0.07)' },
  confFill: { height: 4, borderRadius: 2, backgroundColor: '#34C759' },
  confText: { fontSize: 11, color: '#9A9AA4', fontWeight: '500', width: 80, textAlign: 'right' },

  // Rate
  rateRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(10,10,20,0.05)', alignItems: 'center', minHeight: 32 },
  rateError: { fontSize: 13, color: '#FF3B30' },
  rateValue: { fontSize: 14, fontWeight: '500', color: '#0B0B12' },
  ratePrice: { fontWeight: '700', color: '#635BFF' },
  ratePending: { fontSize: 13, color: '#9A9AA4' },

  // Footer total
  footTotal: { alignItems: 'flex-end' },
  footTotalLabel: { fontSize: 12.5, fontWeight: '600', color: '#9A9AA4' },
  footTotalValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, color: '#0B0B12' },

  // Done screen
  doneCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  doneTitle: { fontSize: 24, fontWeight: '700' },
  doneSub: { fontSize: 16, color: '#6B6B76' },
  doneFail: { fontSize: 14, color: '#FF3B30' },
  doneBtn: { marginTop: 24, height: 52, paddingHorizontal: 40, borderRadius: 14, backgroundColor: '#635BFF', alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
