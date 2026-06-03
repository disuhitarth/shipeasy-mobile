import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useGuestCheckout } from '@/lib/queries';
import api from '@/lib/api';

const PACKAGE_PRESETS = [
  { id: 'envelope', label: 'Envelope', icon: 'document-text' as const },
  { id: 'small-box', label: 'Small', icon: 'cube' as const },
  { id: 'medium-box', label: 'Medium', icon: 'cube' as const },
  { id: 'large-box', label: 'Large', icon: 'cube' as const },
];

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

export default function ShipNowScreen() {
  const checkout = useGuestCheckout();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', address1: '', address2: '', city: '',
    province_code: 'ON', postal_code: '', country_code: 'CA',
    email: '', phone: '', itemDescription: '',
  });
  const [preset, setPreset] = useState('small-box');

  const update = useCallback((p: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const submit = useCallback(async () => {
    if (!form.name || !form.address1 || !form.city || !form.postal_code || !form.email || !form.itemDescription) {
      Alert.alert('Missing fields', 'Please fill in all required fields');
      return;
    }

    try {
      const { url } = await checkout.mutateAsync({ ...form, packagePreset: preset });
      await WebBrowser.openBrowserAsync(url);

      // After returning from browser, try to find the guest shipment
      // We can look up by checking recent unpaid shipments or showing a success message
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#0B0B12" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ship Now</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Package type</Text>
        <View style={styles.presetRow}>
          {PACKAGE_PRESETS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.presetBtn, preset === p.id && styles.presetBtnActive]}
              onPress={() => setPreset(p.id)}
            >
              <Ionicons name={p.icon} size={20} color={preset === p.id ? '#fff' : '#635BFF'} />
              <Text style={[styles.presetLabel, preset === p.id && styles.presetLabelActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Recipient</Text>
        <Input label="Full name *" value={form.name} onChange={(t) => update({ name: t })} />
        <Input label="Address line 1 *" value={form.address1} onChange={(t) => update({ address1: t })} />
        <Input label="Address line 2" value={form.address2} onChange={(t) => update({ address2: t })} />
        <Input label="City *" value={form.city} onChange={(t) => update({ city: t })} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
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
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Postal code *" value={form.postal_code} onChange={(t) => update({ postal_code: t.toUpperCase() })} autoCapitalize="characters" />
          </View>
        </View>

        <Text style={styles.section}>Contact</Text>
        <Input label="Email *" value={form.email} onChange={(t) => update({ email: t })} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone" value={form.phone} onChange={(t) => update({ phone: t })} keyboardType="phone-pad" />

        <Text style={styles.section}>Item</Text>
        <Input label="What are you shipping? *" value={form.itemDescription} onChange={(t) => update({ itemDescription: t })} placeholder="e.g. T-shirt" />

        <View style={styles.legal}>
          <Ionicons name="lock-closed" size={14} color="#9A9AA4" />
          <Text style={styles.legalText}>Secured by Stripe · No account needed</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.cta, busy && styles.ctaDisabled]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.ctaText}>Continue to payment</Text>}
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
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || ''}
        placeholderTextColor="#9A9AA4"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
      />
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
  bodyInner: { padding: 20, gap: 12, paddingBottom: 40 },
  section: {
    fontSize: 13, fontWeight: '600', color: '#6B6B76',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
  },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  presetBtnActive: { backgroundColor: '#635BFF', borderColor: '#635BFF' },
  presetLabel: { fontSize: 13, fontWeight: '600', color: '#6B6B76' },
  presetLabelActive: { color: '#fff' },
  inputLabel: { fontSize: 12.5, fontWeight: '600', color: '#6B6B76', marginBottom: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: '#0B0B12', borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  row: { flexDirection: 'row', gap: 12 },
  provinceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  provBtn: {
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7,
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  provBtnActive: { backgroundColor: '#635BFF', borderColor: '#635BFF' },
  provText: { fontSize: 12, fontWeight: '600', color: '#6B6B76' },
  provTextActive: { color: '#fff' },
  legal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  legalText: { fontSize: 12, color: '#9A9AA4' },
  footer: { padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(10,10,20,0.07)' },
  cta: { height: 52, borderRadius: 14, backgroundColor: '#635BFF', alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.42 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
