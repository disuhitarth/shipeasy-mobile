import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useCreateTopup } from '@/lib/queries';

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#0B0B12" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add funds</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
        {/* Amount presets */}
        <Text style={styles.label}>Select amount</Text>
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.preset, selected === p && styles.presetActive]}
              onPress={() => { setSelected(p); setCustom(''); }}
            >
              <Text style={[styles.presetText, selected === p && styles.presetTextActive]}>
                ${p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom */}
        <Text style={styles.label}>Custom amount</Text>
        <View style={styles.customRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.customInput}
            value={custom}
            onChangeText={(t) => { setCustom(t); setSelected(null); }}
            placeholder="0.00"
            placeholderTextColor="#9A9AA4"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>You'll be charged</Text>
          <Text style={styles.summaryAmount}>${amount.toFixed(2)} CAD</Text>
          <Text style={styles.summaryNote}>
            Funds will be credited to your wallet immediately after payment.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, (topup.isPending || amount < 10) && styles.ctaDisabled]}
          onPress={submit}
          disabled={topup.isPending || amount < 10}
        >
          {topup.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Add ${amount.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 17, fontWeight: '600' },
  body: { flex: 1 },
  bodyInner: { padding: 20, gap: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B6B76', textTransform: 'uppercase', letterSpacing: 0.5 },
  presets: { flexDirection: 'row', gap: 10 },
  preset: {
    flex: 1, height: 52, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  presetActive: { backgroundColor: '#635BFF', borderColor: '#635BFF' },
  presetText: { fontSize: 16, fontWeight: '700', color: '#0B0B12' },
  presetTextActive: { color: '#fff' },
  customRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  dollarSign: { fontSize: 20, fontWeight: '700', color: '#9A9AA4' },
  customInput: { flex: 1, height: 52, fontSize: 20, fontWeight: '700', color: '#0B0B12' },
  summary: {
    backgroundColor: '#fff', borderRadius: 14, padding: 20,
    alignItems: 'center', gap: 4, marginTop: 20,
  },
  summaryLabel: { fontSize: 13, color: '#9A9AA4', fontWeight: '500' },
  summaryAmount: { fontSize: 38, fontWeight: '700', color: '#0B0B12', letterSpacing: -1.2 },
  summaryNote: { fontSize: 13, color: '#9A9AA4', textAlign: 'center', marginTop: 8 },
  footer: { padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(10,10,20,0.07)' },
  cta: {
    height: 52, borderRadius: 14, backgroundColor: '#635BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.42 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
