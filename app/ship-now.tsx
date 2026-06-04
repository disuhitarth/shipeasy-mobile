import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useGuestCheckout, useGetRates } from '@/lib/queries';
import api from '@/lib/api';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';

const PACKAGE_TYPES = [
  { id: 'envelope', label: 'Envelope', icon: 'document-text' as const },
  { id: 'pak', label: 'Pak', icon: 'briefcase' as const },
  { id: 'box', label: 'Box', icon: 'cube' as const },
];

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

const RATES_INFO = [
  { id: 'ECO', name: 'Stallion Economy', svc: 'No tracking', days: '5–8 business days' },
  { id: 'TRK', name: 'Stallion Tracked', svc: 'Full tracking', days: '3–5 business days', badge: 'Popular' },
  { id: 'EXP', name: 'Stallion Express', svc: 'Tracked · Priority', days: '2–3 business days', badge: 'Fastest' },
  { id: 'PRI', name: 'Stallion Priority', svc: 'Tracked · Insured', days: '1–2 business days' },
];

export default function ShipNowScreen() {
  const checkout = useGuestCheckout();
  const getRates = useGetRates();
  const qc = useQueryClient();
  const [preset, setPreset] = useState('envelope');
  const [form, setForm] = useState({
    name: '', company: '', address1: '', address2: '', city: '',
    province_code: 'ON', postal_code: '', country_code: 'CA',
    email: '', phone: '', itemDescription: '',
    weight: '', weightUnit: 'lb' as 'lb' | 'kg',
    length: '', width: '', height: '', dimUnit: 'in' as 'in' | 'cm',
    rateId: 'ECO',
  });
  const [rates, setRates] = useState<{ id: string; totalPrice: number }[] | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const rateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((p: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  useEffect(() => {
    const w = parseFloat(form.weight);
    if (!w || !form.postal_code) return;
    if (rateTimer.current) clearTimeout(rateTimer.current);
    rateTimer.current = setTimeout(async () => {
      setRatesLoading(true);
      try {
        const res = await getRates.mutateAsync({
          fromPostalCode: 'M5T2C9',
          toCountry: form.country_code,
          toPostalCode: form.postal_code,
          weight: w,
          weightUnit: form.weightUnit,
          length: parseFloat(form.length) || undefined,
          width: parseFloat(form.width) || undefined,
          height: parseFloat(form.height) || undefined,
        });
        setRates(res.rates);
      } catch {
        setRates([
          { id: 'ECO', totalPrice: 11.13 },
          { id: 'TRK', totalPrice: 16.05 },
          { id: 'EXP', totalPrice: 21.40 },
          { id: 'PRI', totalPrice: 29.83 },
        ]);
      } finally {
        setRatesLoading(false);
      }
    }, 600);
    return () => { if (rateTimer.current) clearTimeout(rateTimer.current); };
  }, [form.weight, form.weightUnit, form.length, form.width, form.height, form.postal_code, form.country_code]);

  const submit = useCallback(async () => {
    if (!form.name || !form.address1 || !form.city || !form.postal_code || !form.email || !form.itemDescription || !form.weight) {
      Alert.alert('Missing fields', 'Please fill in all required fields');
      return;
    }

    try {
      const { url } = await checkout.mutateAsync({ ...form, packagePreset: preset });
      await WebBrowser.openBrowserAsync(url);

      qc.invalidateQueries({ queryKey: ['shipments'] });
      Alert.alert(
        'Payment submitted',
        'Your label is being generated. Check your email for the download link, or check back in Shipments.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/shipments') }],
      );
    } catch {}
  }, [form, preset, checkout, qc]);

  const busy = checkout.isPending;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ship Now</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Package type</Text>
        <View style={styles.typeGrid}>
          {PACKAGE_TYPES.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.typeCard, preset === p.id && styles.typeCardActive]}
              onPress={() => setPreset(p.id)}
            >
              <Ionicons name={p.icon} size={24} color={preset === p.id ? colors.accent : colors.muted} />
              <Text style={[styles.typeLabel, preset === p.id && styles.typeLabelActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.weightCard}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Weight</Text>
            <View style={styles.segControl}>
              {(['lb', 'kg'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segBtn, form.weightUnit === u && styles.segBtnActive]}
                  onPress={() => update({ weightUnit: u })}
                >
                  <Text style={[styles.segText, form.weightUnit === u && styles.segTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.bigInputRow}>
            <TextInput
              style={styles.bigInput}
              inputMode="decimal"
              placeholder="0.0"
              placeholderTextColor={colors.faint}
              value={form.weight}
              onChangeText={(v) => update({ weight: v })}
            />
            <Text style={styles.bigUnit}>{form.weightUnit}</Text>
          </View>
        </View>

        <View style={styles.dimsCard}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Dimensions</Text>
            <View style={styles.segControl}>
              {(['in', 'cm'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segBtn, form.dimUnit === u && styles.segBtnActive]}
                  onPress={() => update({ dimUnit: u })}
                >
                  <Text style={[styles.segText, form.dimUnit === u && styles.segTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.dimsRow}>
            {(['length', 'width', 'height'] as const).map((k) => (
              <View key={k} style={styles.dimField}>
                <TextInput
                  style={styles.dimInput}
                  inputMode="decimal"
                  placeholder="0"
                  placeholderTextColor={colors.faint}
                  value={form[k]}
                  onChangeText={(v) => update({ [k]: v })}
                />
                <Text style={styles.dimLabel}>
                  {k === 'length' ? 'L' : k === 'width' ? 'W' : 'H'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.section}>Recipient</Text>
        <View style={styles.card}>
          <Input label="Full name *" value={form.name} onChange={(t) => update({ name: t })} />
          <Input label="Company" value={form.company} onChange={(t) => update({ company: t })} />
          <Input label="Address line 1 *" value={form.address1} onChange={(t) => update({ address1: t })} />
          <Input label="Address line 2" value={form.address2} onChange={(t) => update({ address2: t })} />
          <Input label="City *" value={form.city} onChange={(t) => update({ city: t })} />
          <Text style={styles.inputLabel}>Province</Text>
          <View style={styles.provinceRow}>
            {PROVINCES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.provBtn, form.province_code === p && styles.provBtnActive]}
                onPress={() => update({ province_code: p })}
              >
                <Text style={[styles.provText, form.province_code === p && styles.provTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label="Postal code *" value={form.postal_code} onChange={(t) => update({ postal_code: t.toUpperCase() })} autoCapitalize="characters" />
        </View>

        <Text style={styles.section}>Contact</Text>
        <View style={styles.card}>
          <Input label="Email *" value={form.email} onChange={(t) => update({ email: t })} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone" value={form.phone} onChange={(t) => update({ phone: t })} keyboardType="phone-pad" />
        </View>

        <Text style={styles.section}>Item</Text>
        <View style={styles.card}>
          <Input label="What are you shipping? *" value={form.itemDescription} onChange={(t) => update({ itemDescription: t })} placeholder="e.g. T-shirt" />
        </View>

        <Text style={styles.section}>Carrier</Text>
        <View style={styles.ratesContainer}>
          {ratesLoading ? (
            <View style={styles.ratesLoadingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.ratesLoadingText}>Fetching live rates…</Text>
            </View>
          ) : rates ? (
            rates.map((rate) => {
              const r = RATES_INFO.find((ri) => ri.id === rate.id) || RATES_INFO[0];
              const sel = form.rateId === rate.id;
              return (
                <TouchableOpacity
                  key={rate.id}
                  style={[styles.rateCard, sel && styles.rateCardActive]}
                  onPress={() => update({ rateId: rate.id })}
                >
                  <View style={[styles.rateIconWrap, sel && styles.rateIconWrapActive]}>
                    <Ionicons name="cube" size={20} color={sel ? colors.white : colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rateNameRow}>
                      <Text style={styles.rateName}>{r.name}</Text>
                      {'badge' in r && r.badge && (
                        <Text style={[styles.rateBadge, r.badge === 'Fastest' && styles.rateBadgeFast]}>
                          {r.badge}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.rateMeta}>{r.days} · {r.svc}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ratePrice}>${rate.totalPrice.toFixed(2)}</Text>
                    <Text style={styles.rateTax}>incl. HST</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.ratesHint}>
              <Ionicons name="information-circle" size={16} color={colors.faint} />
              <Text style={styles.ratesHintText}>Enter weight and postal code to see rates</Text>
            </View>
          )}
        </View>

        <View style={styles.legal}>
          <Ionicons name="lock-closed" size={14} color={colors.faint} />
          <Text style={styles.legalText}>Secured by Stripe · No account needed</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, busy && styles.ctaDisabled]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.ctaText}>Continue to payment</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Input({ label, value, onChange, placeholder, keyboardType, autoCapitalize }: {
  label: string; value: string; onChange: (t: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={{ marginBottom: 0 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || ''}
        placeholderTextColor={colors.faint}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.sm,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadows.sm,
  },
  headerTitle: { ...typography.title3 },
  body: { flex: 1 },
  bodyInner: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 },
  section: {
    ...typography.eyebrow, color: colors.muted, marginTop: spacing.xs,
  },
  typeGrid: { flexDirection: 'row', gap: spacing.sm },
  typeCard: {
    flex: 1, alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.lg, backgroundColor: colors.surface,
    borderRadius: borderRadius.md, ...shadows.sm,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  typeCardActive: { borderColor: colors.accent },
  typeLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  typeLabelActive: { color: colors.accent },
  weightCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, ...shadows.sm,
  },
  dimsCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  cardLabel: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  segControl: {
    flexDirection: 'row', backgroundColor: colors.surface2,
    borderRadius: 10, padding: 2,
  },
  segBtn: {
    paddingHorizontal: 10, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  segBtnActive: { backgroundColor: colors.surface },
  segText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  segTextActive: { color: colors.ink },
  bigInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  bigInput: {
    flex: 1, fontSize: 46, fontWeight: '700', letterSpacing: -2,
    color: colors.ink, padding: 0,
  },
  bigUnit: { fontSize: 22, fontWeight: '600', color: colors.faint },
  dimsRow: { flexDirection: 'row', gap: spacing.sm },
  dimField: { flex: 1, alignItems: 'center', gap: spacing.xs },
  dimInput: {
    width: '100%', height: 56, textAlign: 'center',
    borderRadius: borderRadius.sm, backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.hairline,
    fontSize: 22, fontWeight: '700', color: colors.ink,
  },
  dimLabel: { fontSize: 12, fontWeight: '600', color: colors.faint },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, gap: spacing.lg, ...shadows.sm,
  },
  inputLabel: { fontSize: 12.5, fontWeight: '600', color: colors.muted, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface2, height: 50,
    borderRadius: borderRadius.sm, paddingHorizontal: spacing.lg,
    fontSize: 15, color: colors.ink,
    borderWidth: 1, borderColor: colors.hairline,
  },
  provinceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  provBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm, backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.hairline,
  },
  provBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  provText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  provTextActive: { color: colors.white },
  ratesContainer: { gap: spacing.sm },
  ratesLoadingRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  ratesLoadingText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  rateCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, backgroundColor: colors.surface,
    borderRadius: borderRadius.sm, borderWidth: 1.5, borderColor: 'transparent',
    ...shadows.sm,
  },
  rateCardActive: { borderColor: colors.accent },
  rateIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  rateIconWrapActive: { backgroundColor: colors.accent },
  rateNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rateName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2, color: colors.ink },
  rateBadge: {
    fontSize: 10, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, backgroundColor: colors.greenSoft, color: colors.green,
    textTransform: 'uppercase', letterSpacing: 0.4, overflow: 'hidden',
  },
  rateBadgeFast: { backgroundColor: colors.accentSoft, color: colors.accent },
  rateMeta: { fontSize: 12.5, color: colors.faint, marginTop: spacing.xs },
  ratePrice: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4, color: colors.ink },
  rateTax: { fontSize: 11, color: colors.faint, marginTop: 1 },
  ratesHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.surface2,
    borderRadius: borderRadius.sm,
  },
  ratesHintText: { fontSize: 12.5, color: colors.muted, flex: 1, lineHeight: 18 },
  legal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm },
  legalText: { fontSize: 12, color: colors.faint },
  footer: {
    padding: spacing.xl, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: colors.hairline,
  },
  cta: {
    height: 52, borderRadius: borderRadius.sm, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 18, elevation: 4,
  },
  ctaDisabled: { opacity: 0.42 },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
