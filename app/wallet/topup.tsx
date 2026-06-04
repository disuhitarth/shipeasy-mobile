import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useCreateTopup } from '@/lib/queries';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';

const PRESETS = [25, 50, 100, 200, 500];

export default function TopupScreen() {
  const [custom, setCustom] = useState('');
  const [selected, setSelected] = useState<number | null>(100);
  const qc = useQueryClient();
  const topup = useCreateTopup();

  const submit = useCallback(async () => {
    const amount = selected ?? parseFloat(custom);
    if (!amount || amount < 10) {
      Alert.alert('Minimum $10', 'Top-up amount must be at least $10.00');
      return;
    }
    try {
      const { url } = await topup.mutateAsync(amount);
      await WebBrowser.openBrowserAsync(url);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      router.back();
    } catch {}
  }, [selected, custom, topup, qc]);

  const amount = selected ?? (parseFloat(custom) || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add funds</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner} keyboardShouldPersistTaps="handled">
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to add</Text>
          <View style={styles.amountRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={custom}
              onChangeText={(t) => { setCustom(t); setSelected(null); }}
              placeholder="0"
              placeholderTextColor={colors.hairline}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Text style={styles.section}>Quick amounts</Text>
        <View style={styles.presetsRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.presetChip, selected === p && styles.presetChipActive]}
              onPress={() => { setSelected(p); setCustom(''); }}
            >
              <Text style={[styles.presetText, selected === p && styles.presetTextActive]}>
                ${p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="wallet-outline" size={22} color={colors.accent} />
          <Text style={styles.summaryLabel}>You'll be charged</Text>
          <Text style={styles.summaryAmount}>${amount.toFixed(2)} CAD</Text>
          <Text style={styles.summaryNote}>
            Funds will be credited to your wallet immediately after payment.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, (topup.isPending || amount < 10) && styles.ctaDisabled]}
          onPress={submit}
          disabled={topup.isPending || amount < 10}
        >
          {topup.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.ctaText}>Add ${amount.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
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
