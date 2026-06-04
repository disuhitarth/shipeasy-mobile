import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TextInput as RNTextInput } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { useCreateTopup } from '@/lib/queries';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import { validateAmount } from '@/lib/validation';
import { toast } from '@/lib/toast';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';

const PRESETS = [25, 50, 100, 200, 500];
const MIN = 10;
const MAX = 1000;

export default function TopupScreen() {
  const [custom, setCustom] = useState('');
  const [selected, setSelected] = useState<number | null>(100);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const qc = useQueryClient();
  const topup = useCreateTopup();
  const inputRef = useRef<RNTextInput>(null);
  const insets = useSafeAreaInsets();

  const computeError = useCallback((val: string, sel: number | null): string | null => {
    if (sel != null) {
      return validateAmount(sel, MIN, MAX);
    }
    const s = val.trim();
    if (!s) return 'Enter an amount or pick a preset';
    const n = parseFloat(s);
    if (Number.isNaN(n)) return 'Enter a valid amount';
    return validateAmount(n, MIN, MAX);
  }, []);

  useEffect(() => {
    if (touched) setError(computeError(custom, selected));
  }, [custom, selected, touched, computeError]);

  const onCustomChange = (t: string) => {
    const cleaned = t.replace(/[^0-9.]/g, '');
    setCustom(cleaned);
    setSelected(null);
    setTouched(true);
  };

  const onPresetPress = (p: number) => {
    setSelected(p);
    setCustom('');
    setTouched(true);
  };

  const submit = useCallback(async () => {
    setTouched(true);
    const e = computeError(custom, selected);
    setError(e);
    if (e) {
      if (!selected && custom === '') inputRef.current?.focus();
      toast.error(e);
      return;
    }
    const amount = selected ?? parseFloat(custom);
    try {
      const { url } = await topup.mutateAsync(amount);
      await WebBrowser.openBrowserAsync(url);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      toast.success(`Opening $${amount.toFixed(2)} top-up…`);
      router.back();
    } catch (err: any) {
      toast.error(err?.message || 'Could not start top-up');
    }
  }, [custom, selected, topup, qc, computeError]);

  const amount = selected ?? (parseFloat(custom) || 0);
  const disabled = topup.isPending || amount < MIN || amount > MAX || !!error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View entering={FadeInDown.duration(360)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale style={styles.navBtn} onPress={() => router.back()} haptic="light">
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle}>Add funds</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInUp.duration(360).delay(80)} style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to add</Text>
          <View style={styles.amountRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              ref={inputRef}
              style={styles.amountInput}
              value={custom}
              onChangeText={onCustomChange}
              onBlur={() => setTouched(true)}
              placeholder="0"
              placeholderTextColor={colors.hairline}
              keyboardType="decimal-pad"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          </View>
          {touched && error ? (
            <Text style={styles.fieldError}>{error}</Text>
          ) : (
            <Text style={styles.hintText}>Minimum ${MIN.toFixed(2)} · Maximum ${MAX.toFixed(2)}</Text>
          )}
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(360).delay(140)} style={styles.section}>
          Quick amounts
        </Animated.Text>
        <View style={styles.presetsRow}>
          {PRESETS.map((p, i) => (
            <Animated.View
              key={p}
              entering={FadeInUp.duration(360).delay(180 + i * 50)}
            >
              <PressableScale
                style={[styles.presetChip, selected === p && styles.presetChipActive]}
                onPress={() => {
                  Haptics.selection();
                  onPresetPress(p);
                }}
                haptic="selection"
                scaleTo={0.94}
              >
                <Text style={[styles.presetText, selected === p && styles.presetTextActive]}>
                  ${p}
                </Text>
              </PressableScale>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.duration(360).delay(440)} style={styles.summaryCard}>
          <Ionicons name="wallet-outline" size={22} color={colors.accent} />
          <Text style={styles.summaryLabel}>You'll be charged</Text>
          <Animated.Text key={amount} entering={FadeInUp.duration(280)} style={styles.summaryAmount}>
            ${amount.toFixed(2)} CAD
          </Animated.Text>
          <Text style={styles.summaryNote}>
            Funds will be credited to your wallet immediately after payment.
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(360).delay(120)} style={styles.footer}>
        <PressableScale
          style={[styles.cta, disabled && styles.ctaDisabled]}
          onPress={submit}
          disabled={disabled}
          haptic="success"
        >
          {topup.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.ctaText}>Add ${amount.toFixed(2)}</Text>
          )}
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
  bodyInner: { padding: spacing.xl, gap: spacing.xl, paddingBottom: 40 },
  amountCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing['2xl'], alignItems: 'center', ...shadows.sm,
    marginTop: spacing.sm,
  },
  amountLabel: {
    fontSize: 13, fontWeight: '600', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
  },
  dollarSign: {
    fontSize: 46, fontWeight: '700', color: colors.faint, letterSpacing: -2,
  },
  amountInput: {
    fontSize: 46, fontWeight: '700', letterSpacing: -2, color: colors.ink,
    padding: 0, textAlign: 'center', minWidth: 100,
  },
  fieldError: {
    fontSize: 13, color: colors.red, marginTop: spacing.md, fontWeight: '500',
  },
  hintText: {
    fontSize: 12.5, color: colors.faint, marginTop: spacing.md,
  },
  section: {
    ...typography.eyebrow, color: colors.muted,
  },
  presetsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.hairline, ...shadows.sm,
  },
  presetChipActive: {
    backgroundColor: colors.accent, borderColor: colors.accent,
  },
  presetText: {
    fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.4,
  },
  presetTextActive: { color: colors.white },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing['2xl'], alignItems: 'center', gap: spacing.sm,
    ...shadows.sm,
  },
  summaryLabel: { fontSize: 13, color: colors.faint, fontWeight: '500' },
  summaryAmount: {
    fontSize: 38, fontWeight: '700', color: colors.ink, letterSpacing: -1.2,
  },
  summaryNote: {
    fontSize: 13, color: colors.faint, textAlign: 'center', marginTop: spacing.xs,
    lineHeight: 18,
  },
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
