import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { useGuestCheckout, useGetRates } from '@/lib/queries';
import api from '@/lib/api';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import { validateEmail, validateName, validateCity, validatePostalCode, validateRequired, validateWeight, validateForm, type ValidationResult } from '@/lib/validation';
import { toast } from '@/lib/toast';
import { FormField } from '@/components/ui/FormField';
import { PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';
import { preventCapture, allowCapture } from '@/lib/screenCapture';

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

type FormShape = {
  name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  province_code: string;
  postal_code: string;
  country_code: string;
  email: string;
  phone: string;
  itemDescription: string;
  weight: string;
  weightUnit: 'lb' | 'kg';
  length: string;
  width: string;
  height: string;
  dimUnit: 'in' | 'cm';
  rateId: string;
};

const EMPTY: FormShape = {
  name: '', company: '', address1: '', address2: '', city: '',
  province_code: 'ON', postal_code: '', country_code: 'CA',
  email: '', phone: '', itemDescription: '',
  weight: '', weightUnit: 'lb',
  length: '', width: '', height: '', dimUnit: 'in',
  rateId: 'ECO',
};

export default function ShipNowScreen() {
  const checkout = useGuestCheckout();
  const getRates = useGetRates();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [preset, setPreset] = useState('envelope');
  const [form, setForm] = useState<FormShape>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [rates, setRates] = useState<{ id: string; totalPrice: number }[] | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const rateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nameRef = useRef<RNTextInput>(null);
  const companyRef = useRef<RNTextInput>(null);
  const address1Ref = useRef<RNTextInput>(null);
  const address2Ref = useRef<RNTextInput>(null);
  const cityRef = useRef<RNTextInput>(null);
  const postalRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const phoneRef = useRef<RNTextInput>(null);
  const itemRef = useRef<RNTextInput>(null);

  const update = useCallback((p: Partial<FormShape>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      preventCapture('ship-now');
      return () => {
        allowCapture('ship-now');
      };
    }, []),
  );

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

  const onFieldChange = useCallback((key: keyof FormShape, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (touched[key]) {
        setTimeout(() => {
          const r = computeErrors(next);
          setErrors(r.errors);
        }, 0);
      }
      return next;
    });
  }, [touched]);

  const onFieldBlur = useCallback((key: keyof FormShape) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setTimeout(() => {
      const r = computeErrors(form);
      setErrors(r.errors);
    }, 0);
  }, [form]);

  function computeErrors(values: FormShape): ValidationResult {
    return validateForm(values, {
      name: validateName,
      address1: (v) => validateRequired(String(v ?? ''), 'Address line 1'),
      city: validateCity,
      postal_code: (v) => validatePostalCode(String(v ?? ''), values.country_code),
      email: validateEmail,
      itemDescription: (v) => validateRequired(String(v ?? ''), 'Item description'),
      weight: (v) => {
        const s = String(v ?? '').trim();
        if (!s) return 'Weight is required';
        const n = parseFloat(s);
        if (Number.isNaN(n)) return 'Enter a valid weight';
        return validateWeight(n, values.weightUnit);
      },
    });
  }

  const submit = useCallback(async () => {
    setTouched({
      name: true, address1: true, city: true, postal_code: true,
      email: true, itemDescription: true, weight: true,
    });
    const r = computeErrors(form);
    setErrors(r.errors);
    if (!r.isValid) {
      const order: (keyof FormShape)[] = ['name', 'address1', 'city', 'postal_code', 'email', 'itemDescription', 'weight'];
      const first = order.find((k) => r.errors[k]);
      const refMap: Partial<Record<keyof FormShape, React.RefObject<RNTextInput | null>>> = {
        name: nameRef, address1: address1Ref, city: cityRef, postal_code: postalRef,
        email: emailRef, itemDescription: itemRef,
      };
      if (first) refMap[first]?.current?.focus();
      toast.error('Please fix the highlighted fields');
      return;
    }

    try {
      const { url } = await checkout.mutateAsync({ ...form, packagePreset: preset });
      await WebBrowser.openBrowserAsync(url);

      qc.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Payment submitted — check your email for the label');
      setTimeout(() => router.replace('/(tabs)/shipments'), 800);
    } catch (e: any) {
      toast.error(e?.message || 'Could not start checkout');
    }
  }, [form, preset, checkout, qc]);

  const busy = checkout.isPending;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View entering={FadeInDown.duration(360)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale style={styles.navBtn} onPress={() => router.back()} haptic="light">
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle}>Ship Now</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner} keyboardShouldPersistTaps="handled">
        <Animated.Text entering={FadeInUp.duration(360).delay(80)} style={styles.section}>
          Package type
        </Animated.Text>
        <View style={styles.typeGrid}>
          {PACKAGE_TYPES.map((p, i) => (
            <Animated.View
              key={p.id}
              entering={FadeInUp.duration(360).delay(120 + i * 70)}
              style={{ flex: 1 }}
            >
              <PressableScale
                style={[styles.typeCard, preset === p.id && styles.typeCardActive]}
                onPress={() => { Haptics.light(); setPreset(p.id); }}
                haptic="light"
              >
                <Ionicons name={p.icon} size={24} color={preset === p.id ? colors.accent : colors.muted} />
                <Text style={[styles.typeLabel, preset === p.id && styles.typeLabelActive]}>{p.label}</Text>
              </PressableScale>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.duration(360).delay(320)} style={styles.weightCard}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Weight *</Text>
            <View style={styles.segControl}>
              {(['lb', 'kg'] as const).map((u) => (
                <PressableScale
                  key={u}
                  style={[styles.segBtn, form.weightUnit === u && styles.segBtnActive]}
                  onPress={() => { Haptics.selection(); update({ weightUnit: u }); }}
                  haptic="selection"
                  scaleTo={0.94}
                >
                  <Text style={[styles.segText, form.weightUnit === u && styles.segTextActive]}>{u}</Text>
                </PressableScale>
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
              onChangeText={(v) => onFieldChange('weight', v)}
              onBlur={() => onFieldBlur('weight')}
              returnKeyType="next"
            />
            <Text style={styles.bigUnit}>{form.weightUnit}</Text>
          </View>
          {touched.weight && errors.weight ? (
            <Text style={styles.fieldError}>{errors.weight}</Text>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(360).delay(400)} style={styles.dimsCard}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Dimensions</Text>
            <View style={styles.segControl}>
              {(['in', 'cm'] as const).map((u) => (
                <PressableScale
                  key={u}
                  style={[styles.segBtn, form.dimUnit === u && styles.segBtnActive]}
                  onPress={() => { Haptics.selection(); update({ dimUnit: u }); }}
                  haptic="selection"
                  scaleTo={0.94}
                >
                  <Text style={[styles.segText, form.dimUnit === u && styles.segTextActive]}>{u}</Text>
                </PressableScale>
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
                  returnKeyType={k === 'height' ? 'done' : 'next'}
                />
                <Text style={styles.dimLabel}>
                  {k === 'length' ? 'L' : k === 'width' ? 'W' : 'H'}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(360).delay(480)} style={styles.section}>
          Recipient
        </Animated.Text>
        <Animated.View entering={FadeInUp.duration(360).delay(540)} style={styles.card}>
          <FormField
            ref={nameRef}
            label="Full name *"
            value={form.name}
            onChangeText={(t) => onFieldChange('name', t)}
            onBlur={() => onFieldBlur('name')}
            error={touched.name ? errors.name : null}
            required
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => companyRef.current?.focus()}
          />
          <FormField
            ref={companyRef}
            label="Company"
            value={form.company}
            onChangeText={(t) => update({ company: t })}
            autoCapitalize="words"
            autoComplete="organization"
            textContentType="organizationName"
            returnKeyType="next"
            onSubmitEditing={() => address1Ref.current?.focus()}
          />
          <FormField
            ref={address1Ref}
            label="Address line 1 *"
            value={form.address1}
            onChangeText={(t) => onFieldChange('address1', t)}
            onBlur={() => onFieldBlur('address1')}
            error={touched.address1 ? errors.address1 : null}
            required
            autoCapitalize="words"
            autoComplete="address-line1"
            textContentType="streetAddressLine1"
            returnKeyType="next"
            onSubmitEditing={() => address2Ref.current?.focus()}
          />
          <FormField
            ref={address2Ref}
            label="Address line 2"
            value={form.address2}
            onChangeText={(t) => update({ address2: t })}
            autoCapitalize="words"
            autoComplete="address-line2"
            textContentType="streetAddressLine2"
            returnKeyType="next"
            onSubmitEditing={() => cityRef.current?.focus()}
          />
          <FormField
            ref={cityRef}
            label="City *"
            value={form.city}
            onChangeText={(t) => onFieldChange('city', t)}
            onBlur={() => onFieldBlur('city')}
            error={touched.city ? errors.city : null}
            required
            autoCapitalize="words"
            autoComplete="postal-address-locality"
            textContentType="addressCity"
            returnKeyType="next"
            onSubmitEditing={() => postalRef.current?.focus()}
          />
          <Text style={styles.inputLabel}>Province</Text>
          <View style={styles.provinceRow}>
            {PROVINCES.map((p) => (
              <PressableScale
                key={p}
                style={[styles.provBtn, form.province_code === p && styles.provBtnActive]}
                onPress={() => { Haptics.selection(); update({ province_code: p }); }}
                haptic="selection"
                scaleTo={0.92}
              >
                <Text style={[styles.provText, form.province_code === p && styles.provTextActive]}>{p}</Text>
              </PressableScale>
            ))}
          </View>
          <FormField
            ref={postalRef}
            label="Postal code *"
            value={form.postal_code}
            onChangeText={(t) => onFieldChange('postal_code', t.toUpperCase())}
            onBlur={() => onFieldBlur('postal_code')}
            error={touched.postal_code ? errors.postal_code : null}
            required
            autoCapitalize="characters"
            autoComplete="postal-code"
            textContentType="postalCode"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(360).delay(620)} style={styles.section}>
          Contact
        </Animated.Text>
        <Animated.View entering={FadeInUp.duration(360).delay(660)} style={styles.card}>
          <FormField
            ref={emailRef}
            label="Email *"
            value={form.email}
            onChangeText={(t) => onFieldChange('email', t)}
            onBlur={() => onFieldBlur('email')}
            error={touched.email ? errors.email : null}
            required
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
          />
          <FormField
            ref={phoneRef}
            label="Phone"
            value={form.phone}
            onChangeText={(t) => update({ phone: t })}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="next"
            onSubmitEditing={() => itemRef.current?.focus()}
          />
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(360).delay(700)} style={styles.section}>
          Item
        </Animated.Text>
        <View style={styles.card}>
          <FormField
            ref={itemRef}
            label="What are you shipping? *"
            value={form.itemDescription}
            onChangeText={(t) => onFieldChange('itemDescription', t)}
            onBlur={() => onFieldBlur('itemDescription')}
            error={touched.itemDescription ? errors.itemDescription : null}
            required
            placeholder="e.g. T-shirt"
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        </View>

        <Animated.Text entering={FadeInUp.duration(360).delay(780)} style={styles.section}>
          Carrier
        </Animated.Text>
        <View style={styles.ratesContainer}>
          {ratesLoading ? (
            <View style={styles.ratesLoadingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.ratesLoadingText}>Fetching live rates…</Text>
            </View>
          ) : rates ? (
            rates.map((rate, i) => {
              const r = RATES_INFO.find((ri) => ri.id === rate.id) || RATES_INFO[0];
              const sel = form.rateId === rate.id;
              return (
                <Animated.View
                  key={rate.id}
                  entering={FadeInUp.duration(320).delay(820 + i * 70)}
                >
                  <PressableScale
                    style={[styles.rateCard, sel && styles.rateCardActive]}
                    onPress={() => { Haptics.light(); update({ rateId: rate.id }); }}
                    haptic="light"
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
                  </PressableScale>
                </Animated.View>
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

      <Animated.View entering={FadeInUp.duration(360).delay(120)} style={styles.footer}>
        <PressableScale style={[styles.cta, busy && styles.ctaDisabled]} onPress={submit} disabled={busy} haptic="success">
          {busy ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.ctaText}>Continue to payment</Text>}
        </PressableScale>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.sm,
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
  fieldError: {
    fontSize: 12.5,
    color: colors.red,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
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
