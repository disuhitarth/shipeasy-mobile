import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useWallet } from '@/store/wallet';
import { useGetRates, useCreateShipment } from '@/lib/queries';
import api from '@/lib/api';
import { StepAddress } from '@/components/wizard/StepAddress';
import { StepPackage } from '@/components/wizard/StepPackage';
import { StepCustoms } from '@/components/wizard/StepCustoms';
import { StepRates } from '@/components/wizard/StepRates';
import { StepReview } from '@/components/wizard/StepReview';
import { SuccessScreen } from '@/components/wizard/SuccessScreen';
import { SkuSheet } from '@/components/wizard/SkuSheet';
import { DEFAULT_WIZARD, STEP_TITLES, STEP_SUBS } from '@/components/wizard/types';
import type { WizardState } from '@/components/wizard/types';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';

export default function WizardScreen() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD);
  const [skuSheet, setSkuSheet] = useState(false);
  const [done, setDone] = useState<{ id: string; price: number } | null>(null);
  const [buying, setBuying] = useState(false);
  const [rates, setRates] = useState<{ id: string; totalPrice: number }[] | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  const balance = useWallet((s) => s.balance);
  const deduct = useWallet((s) => s.deduct);
  const getRates = useGetRates();
  const createShipment = useCreateShipment();

  const patch = useCallback((p: Partial<WizardState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const applySku = useCallback((sku: any) => {
    const dimMatch = sku.dimensions?.match(/(\d+)\D+(\d+)\D+(\d+)\s*(in|cm)/);
    patch({
      weight: sku.weight || '',
      weightUnit: sku.weightUnit || 'lb',
      length: dimMatch?.[1] || '',
      width: dimMatch?.[2] || '',
      height: dimMatch?.[3] || '',
      dimUnit: (dimMatch?.[4] as 'in' | 'cm') || 'in',
      items: [{
        description: sku.name || '',
        quantity: String(sku.defaultQuantity || 1),
        value: String(sku.defaultValue || ''),
        origin: sku.countryOfOrigin || 'Canada',
        hsCode: sku.hsCode || '',
      }],
      appliedSku: {
        id: sku._id,
        name: sku.name,
        sku: sku.sku,
        weight: sku.weight || '',
        weightUnit: sku.weightUnit || 'lb',
        dims: sku.dimensions || '',
        value: String(sku.defaultValue || ''),
        countryOfOrigin: sku.countryOfOrigin || 'Canada',
        hsCode: sku.hsCode || '',
      },
    });
  }, [patch]);

  const getTotal = useCallback(() => {
    if (!rates || !state.rateId) return 0;
    const selected = rates.find(r => r.id === state.rateId);
    return selected?.totalPrice ?? 0;
  }, [rates, state.rateId]);

  const goNext = useCallback(async () => {
    if (step === 2) {
      setRatesLoading(true);
      setStep(3);
      try {
        const res = await getRates.mutateAsync({
          fromPostalCode: 'M5T2C9',
          toCountry: state.toCountry || 'CA',
          toPostalCode: state.toPostal || 'V6Z1R8',
          weight: parseFloat(state.weight) || 1,
          weightUnit: state.weightUnit || 'lb',
          length: parseFloat(state.length) || undefined,
          width: parseFloat(state.width) || undefined,
          height: parseFloat(state.height) || undefined,
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
        const el = document.getElementById('wizard-scroll');
        el?.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (step === 4) {
      setBuying(true);
      try {
        const ship = await createShipment.mutateAsync({
          recipientName: state.toName,
          recipientAddress1: state.toLine,
          recipientCity: state.toCity,
          recipientProvinceCode: state.toProvince,
          recipientPostalCode: state.toPostal,
          recipientCountryCode: state.toCountry || 'CA',
          weight: parseFloat(state.weight) || 1,
          weightUnit: state.weightUnit || 'lb',
          packageType: state.packageType,
          postageType: state.rateId,
        });
        deduct(ship.customerTotal || 0);
        setDone({ id: ship.shipCode, price: ship.customerTotal });
      } catch {
        setBuying(false);
      }
      return;
    }

    setStep((s) => s + 1);
    const el = document.getElementById('wizard-scroll');
    el?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, state, getRates, createShipment, deduct]);

  const goBack = useCallback(() => {
    if (step === 0) { router.back(); return; }
    setStep((s) => s - 1);
    if (step === 3) { setRates(null); }
  }, [step]);

  if (done) {
    return (
      <View style={styles.container}>
        <SuccessScreen
          shipment={done}
          onDone={() => router.replace('/(tabs)')}
          onTrack={() => router.replace(`/shipments/${done.id}`)}
          onViewLabel={async () => {
            try {
              const res = await api.get(`/shipments/${done.id}/label`, { responseType: 'arraybuffer' });
              const base64 = btoa(new Uint8Array(res.data).reduce((d, b) => d + String.fromCharCode(b), ''));
              const uri = FileSystem.documentDirectory + `label-${done.id}.pdf`;
              await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
              }
            } catch {
              Alert.alert('Error', 'Could not load label');
            }
          }}
        />
      </View>
    );
  }

  const canContinue = (() => {
    switch (step) {
      case 0: return !!state.toName && !!state.toLine && !!state.toCity && !!state.toPostal;
      case 1: return !!state.weight;
      case 2: return state.items.length > 0;
      case 3: return !!state.rateId && !ratesLoading;
      case 4: return !buying && balance >= getTotal();
      default: return true;
    }
  })();

  const ctaText = buying ? 'Purchasing…' : step < 4 ? 'Continue' : 'Pay now';
  const total = getTotal();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={goBack}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New shipment</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={18} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.progress}>
        {STEP_TITLES.map((_, i) => (
          <View key={i} style={styles.seg}>
            <View style={[
              styles.segFill,
              i < step && styles.segDone,
              i === step && styles.segCurrent,
            ]} />
          </View>
        ))}
      </View>

      <View style={styles.stepHeader}>
        <Text style={styles.stepCount}>Step {step + 1} of {STEP_TITLES.length}</Text>
        <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
        <Text style={styles.stepSub}>{STEP_SUBS[step]}</Text>
      </View>

      <ScrollView
        id="wizard-scroll"
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <StepAddress state={state} set={patch} />}
        {step === 1 && <StepPackage state={state} set={patch} onOpenSku={() => setSkuSheet(true)} />}
        {step === 2 && <StepCustoms state={state} set={patch} />}
        {step === 3 && <StepRates state={state} set={patch} rates={rates ? { rates } : null} isLoading={ratesLoading} />}
        {step === 4 && <StepReview state={state} balance={balance} />}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="chevron-back" size={16} color={colors.ink} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        {step === 4 && (
          <View style={styles.footTotal}>
            <Text style={styles.footTotalLabel}>Total · incl. tax</Text>
            <Text style={styles.footTotalValue}>
              ${total.toFixed(2)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={goNext}
          disabled={!canContinue || buying}
        >
          {buying ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.ctaText}>{ctaText}</Text>
          )}
        </TouchableOpacity>
      </View>

      <SkuSheet open={skuSheet} onClose={() => setSkuSheet(false)} onPick={applySku} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: { ...typography.title3 },
  progress: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  seg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
  },
  segFill: {
    height: '100%',
    width: 0,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  segDone: { width: '100%' },
  segCurrent: { width: '100%' },
  stepHeader: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  stepCount: { ...typography.eyebrow },
  stepTitle: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  stepSub: {
    fontSize: 14.5,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  content: { flex: 1 },
  contentInner: { padding: spacing.xl, paddingBottom: 40 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  footTotal: { alignItems: 'flex-end' },
  footTotalLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.faint,
  },
  footTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
  },
  cta: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  ctaDisabled: { opacity: 0.42 },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
