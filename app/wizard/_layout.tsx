import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useRef } from 'react';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useWallet } from '@/store/wallet';
import { useGetRates, useCreateShipment } from '@/lib/queries';
import api from '@/lib/api';
import { bytesToBase64 } from '@/lib/base64';
import { StepAddress, type StepAddressRef } from '@/components/wizard/StepAddress';
import { StepPackage, type StepPackageRef } from '@/components/wizard/StepPackage';
import { StepCustoms, type StepCustomsRef } from '@/components/wizard/StepCustoms';
import { StepRates } from '@/components/wizard/StepRates';
import { StepReview } from '@/components/wizard/StepReview';
import { SuccessScreen } from '@/components/wizard/SuccessScreen';
import { SkuSheet } from '@/components/wizard/SkuSheet';
import { DEFAULT_WIZARD, STEP_TITLES, STEP_SUBS } from '@/components/wizard/types';
import type { WizardState } from '@/components/wizard/types';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import { toast } from '@/lib/toast';
import { PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';

export default function WizardScreen() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD);
  const [skuSheet, setSkuSheet] = useState(false);
  const [done, setDone] = useState<{ id: string; price: number } | null>(null);
  const [buying, setBuying] = useState(false);
  const [rates, setRates] = useState<{ id: string; totalPrice: number }[] | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const addressRef = useRef<StepAddressRef>(null);
  const packageRef = useRef<StepPackageRef>(null);
  const customsRef = useRef<StepCustomsRef>(null);
  const insets = useSafeAreaInsets();

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

  const advance = useCallback((s: number) => {
    setDirection(1);
    Haptics.light();
    setStep(s);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const goNext = useCallback(async () => {
    if (step === 0) {
      const ok = addressRef.current?.validate();
      if (ok === false) {
        addressRef.current?.focusFirstError();
        toast.error('Please complete the recipient details');
        return;
      }
      advance(step + 1);
      return;
    }

    if (step === 1) {
      const ok = packageRef.current?.validate();
      if (ok === false) {
        packageRef.current?.focusFirstError();
        toast.error('Enter a valid weight and dimensions');
        return;
      }
      advance(step + 1);
      return;
    }

    if (step === 2) {
      const ok = customsRef.current?.validate();
      if (ok === false) {
        customsRef.current?.focusFirstError();
        toast.error('Complete the customs declarations');
        return;
      }
      setRatesLoading(true);
      setRatesError(false);
      advance(3);
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
        setRates(null);
        setRatesError(true);
        toast.error('Could not fetch rates — try again');
      } finally {
        setRatesLoading(false);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    if (step === 3) {
      if (!state.rateId) {
        toast.warning('Select a shipping rate to continue');
        return;
      }
      advance(step + 1);
      return;
    }

    if (step === 4) {
      const total = getTotal();
      if (balance < total) {
        toast.error('Insufficient wallet balance');
        return;
      }
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
        Haptics.success();
        setDone({ id: ship.shipCode, price: ship.customerTotal });
        toast.success('Shipment purchased');
      } catch (e: any) {
        setBuying(false);
        Haptics.error();
        toast.error(e?.message || 'Could not complete shipment');
      }
      return;
    }
  }, [step, state, getRates, createShipment, deduct, balance, getTotal, advance]);

  const goBack = useCallback(() => {
    if (step === 0) { router.back(); return; }
    setDirection(-1);
    Haptics.light();
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
              const bytes = res.data instanceof Uint8Array ? res.data : new Uint8Array(res.data);
              const base64 = bytesToBase64(bytes);
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

  const ctaText = buying ? 'Purchasing…' : step < 4 ? 'Continue' : 'Pay with wallet';
  const total = getTotal();
  const reviewRateName =
    state.rateId === 'EXP' ? 'Stallion Express'
    : state.rateId === 'PRI' ? 'Stallion Priority'
    : state.rateId === 'ECO' ? 'Stallion Economy'
    : 'Stallion Tracked';
  const reviewRateDays =
    state.rateId === 'EXP' ? '2–3 business days'
    : state.rateId === 'PRI' ? '1–2 business days'
    : state.rateId === 'ECO' ? '5–8 business days'
    : '3–5 business days';

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(360)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale style={styles.navBtn} onPress={goBack} haptic="light">
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle}>New shipment</Text>
        <PressableScale style={styles.navBtn} onPress={() => router.back()} haptic="light">
          <Ionicons name="close" size={18} color={colors.ink} />
        </PressableScale>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(360).delay(50)} style={styles.progress}>
        {STEP_TITLES.map((_, i) => (
          <View key={i} style={styles.seg}>
            <View style={[
              styles.segFill,
              (i < step || (i === step && step === STEP_TITLES.length - 1)) && styles.segDone,
              i === step && step < STEP_TITLES.length - 1 && styles.segCurrent,
              i < step && styles.segDone,
            ]} />
          </View>
        ))}
      </Animated.View>

      <Animated.View
        key={`step-header-${step}`}
        entering={FadeInUp.duration(320)}
        style={styles.stepHeader}
      >
        <Text style={styles.stepCount}>Step {step + 1} of {STEP_TITLES.length}</Text>
        <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
        <Text style={styles.stepSub}>{STEP_SUBS[step]}</Text>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <Animated.View key="step-0" entering={FadeInUp.duration(360)}>
            <StepAddress ref={addressRef} state={state} set={patch} />
          </Animated.View>
        )}
        {step === 1 && (
          <Animated.View key="step-1" entering={FadeInUp.duration(360)}>
            <StepPackage ref={packageRef} state={state} set={patch} onOpenSku={() => setSkuSheet(true)} />
          </Animated.View>
        )}
        {step === 2 && (
          <Animated.View key="step-2" entering={FadeInUp.duration(360)}>
            <StepCustoms ref={customsRef} state={state} set={patch} />
          </Animated.View>
        )}
        {step === 3 && (
          <Animated.View key="step-3" entering={FadeInUp.duration(360)}>
            <StepRates
              state={state}
              set={patch}
              rates={rates ? { rates } : null}
              isLoading={ratesLoading}
              error={ratesError}
              onRetry={() => goNext()}
            />
          </Animated.View>
        )}
        {step === 4 && (
          <Animated.View key="step-4" entering={FadeInUp.duration(360)}>
            <StepReview
              state={state}
              balance={balance}
              total={total || undefined}
              rateName={reviewRateName}
              rateDays={reviewRateDays}
              subtotal={total ? total / 1.13 : undefined}
              tax={total ? total - total / 1.13 : undefined}
            />
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <PressableScale style={styles.backBtn} onPress={goBack} haptic="light">
            <Ionicons name="chevron-back" size={16} color={colors.ink} />
            <Text style={styles.backBtnText}>Back</Text>
          </PressableScale>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
        {step === 4 && (
          <View style={styles.footTotal}>
            <Text style={styles.footTotalLabel}>Total · incl. tax</Text>
            <Text style={styles.footTotalValue}>
              ${total.toFixed(2)}
            </Text>
          </View>
        )}
        <PressableScale
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={goNext}
          disabled={!canContinue || buying}
          haptic={step === 4 ? 'success' : 'light'}
        >
          {buying ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              {step === 4 ? (
                <Ionicons name="wallet" size={16} color={colors.white} style={{ marginRight: 6 }} />
              ) : null}
              <Text style={styles.ctaText}>{ctaText}</Text>
            </>
          )}
        </PressableScale>
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
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  backBtnPlaceholder: { width: 1 },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  footTotal: { alignItems: 'flex-end', flex: 1 },
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
    flexDirection: 'row',
    minWidth: 0,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.42 },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
