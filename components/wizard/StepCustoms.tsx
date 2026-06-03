import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClassifyHS } from '@/lib/queries';
import { useState } from 'react';
import type { WizardState, CustomsItem } from './types';

const HS_GUESS: Record<string, string> = {
  lens: '9002.11',
  camera: '9002.11',
  hoodie: '6110.20',
  shirt: '6109.10',
  book: '4901.99',
  mug: '6912.00',
};

interface Props {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}

export function StepCustoms({ state, set }: Props) {
  const [aiBusy, setAiBusy] = useState(false);
  const classifyHs = useClassifyHS();

  const items = state.items;
  const updateItem = (idx: number, patch: Partial<CustomsItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    set({ items: next });
  };
  const addItem = () => {
    set({ items: [...items, { description: '', quantity: '1', value: '', origin: 'Canada', hsCode: '' }] });
  };
  const removeItem = (idx: number) => {
    set({ items: items.filter((_, i) => i !== idx) });
  };

  const totalValue = items.reduce(
    (s, it) => s + (parseFloat(it.value) || 0) * (parseInt(it.quantity) || 0),
    0,
  );

  const classifyAll = async () => {
    setAiBusy(true);
    const updated = await Promise.all(
      items.map(async (it) => {
        if (it.hsCode || !it.description) return it;
        try {
          const res = await classifyHs.mutateAsync(it.description);
          return { ...it, hsCode: res.hs_code || HS_GUESS[it.description.toLowerCase()] || '6307.90' };
        } catch {
          const match = Object.entries(HS_GUESS).find(([key]) =>
            it.description.toLowerCase().includes(key),
          );
          return { ...it, hsCode: match ? match[1] : '6307.90' };
        }
      }),
    );
    set({ items: updated });
    setAiBusy(false);
  };

  return (
    <View style={styles.container}>
      {/* AI Customs Card */}
      <View style={styles.aiCard}>
        <View style={styles.aiRow}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>AI customs broker</Text>
            <Text style={styles.aiSub}>
              Classifies each item and assigns the correct HS code to prevent border delays.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.aiBtn}
          onPress={classifyAll}
          disabled={aiBusy}
        >
          {aiBusy ? (
            <ActivityIndicator size="small" color="#635BFF" />
          ) : (
            <Ionicons name="sparkles" size={15} color="#635BFF" />
          )}
          <Text style={styles.aiBtnText}>
            {aiBusy
              ? 'Classifying items…'
              : `Auto-classify ${items.length} item${items.length > 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items */}
      {items.map((it, i) => (
        <View key={i} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemNumber}>Item {i + 1}</Text>
            {items.length > 1 && (
              <TouchableOpacity onPress={() => removeItem(i)} style={styles.xBtn}>
                <Ionicons name="close" size={14} color="#6B6B76" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Cotton t-shirt"
              placeholderTextColor="#9A9AA4"
              value={it.description}
              onChangeText={(v) => updateItem(i, { description: v })}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Qty</Text>
              <TextInput
                style={styles.input}
                inputMode="numeric"
                placeholderTextColor="#9A9AA4"
                value={it.quantity}
                onChangeText={(v) => updateItem(i, { quantity: v })}
              />
            </View>
            <View style={[styles.field, { flex: 1.6 }]}>
              <Text style={styles.fieldLabel}>Value (CAD)</Text>
              <TextInput
                style={styles.input}
                inputMode="decimal"
                placeholder="0.00"
                placeholderTextColor="#9A9AA4"
                value={it.value}
                onChangeText={(v) => updateItem(i, { value: v })}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Origin</Text>
              <TextInput
                style={styles.input}
                placeholder="Canada"
                placeholderTextColor="#9A9AA4"
                value={it.origin}
                onChangeText={(v) => updateItem(i, { origin: v })}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>HS code</Text>
              <TextInput
                style={styles.input}
                placeholder="6109.10"
                placeholderTextColor="#9A9AA4"
                value={it.hsCode}
                onChangeText={(v) => updateItem(i, { hsCode: v })}
              />
            </View>
          </View>
        </View>
      ))}

      {/* Add Item */}
      <TouchableOpacity style={styles.addBtn} onPress={addItem}>
        <Ionicons name="add" size={17} color="#635BFF" />
        <Text style={styles.addBtnText}>Add another item</Text>
      </TouchableOpacity>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Declared value</Text>
        <Text style={styles.totalValue}>${totalValue.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  aiCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#635BFF',
  },
  aiRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  aiIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
  aiSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 2, lineHeight: 18 },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    marginTop: 12,
  },
  aiBtnText: { color: '#635BFF', fontSize: 14, fontWeight: '700' },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: { fontSize: 13.5, fontWeight: '600', color: '#0B0B12' },
  xBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F7F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: 7, marginBottom: 11 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#6B6B76', paddingLeft: 2 },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(10,10,20,0.07)',
    backgroundColor: '#F7F7F9',
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#0B0B12',
  },
  row: { flexDirection: 'row', gap: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,10,20,0.07)',
  },
  addBtnText: { color: '#635BFF', fontSize: 14, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  totalLabel: { fontSize: 14, color: '#6B6B76' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#0B0B12' },
});
