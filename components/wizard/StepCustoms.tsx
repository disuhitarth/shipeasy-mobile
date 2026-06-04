import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useClassifyHS } from '@/lib/queries';
import type { WizardState, CustomsItem } from './types';
import { validateRequired, validateHSCode, validateAmount, validateForm } from '@/lib/validation';
import { PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';

const HS_GUESS: Record<string, string> = {
  lens: '9002.11',
  camera: '9002.11',
  hoodie: '6110.20',
  shirt: '6109.10',
  book: '4901.99',
  mug: '6912.00',
};

export interface StepCustomsRef {
  validate: () => boolean;
  focusFirstError: () => void;
}

interface Props {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}

export const StepCustoms = forwardRef<StepCustomsRef, Props>(function StepCustoms({ state, set }, ref) {
  const [aiBusy, setAiBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [touched, setTouched] = useState<Record<string, Record<string, boolean>>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const classifyHs = useClassifyHS();

  const items = state.items;

  const validateOne = (item: CustomsItem, _idx: number): Record<string, string> => {
    return validateForm(item as any, {
      description: (v: any) => validateRequired(String(v ?? ''), 'Description'),
      quantity: (v: any) => {
        const s = String(v ?? '').trim();
        if (!s) return 'Required';
        const n = parseInt(s, 10);
        if (Number.isNaN(n)) return 'Whole number';
        if (n < 1) return 'Min 1';
        if (n > 999) return 'Max 999';
        return null;
      },
      value: (v: any) => {
        const s = String(v ?? '').trim();
        if (!s) return 'Required';
        const n = parseFloat(s);
        if (Number.isNaN(n)) return 'Invalid';
        return validateAmount(n, 0, 100000);
      },
      origin: (v: any) => validateRequired(String(v ?? ''), 'Origin'),
      hsCode: (v: any) => validateHSCode(String(v ?? '')),
    } as any).errors;
  };

  const validate = (): boolean => {
    const next: Record<string, Record<string, string>> = {};
    let allValid = true;
    items.forEach((it, i) => {
      const errs = validateOne(it, i);
      if (Object.keys(errs).length > 0) allValid = false;
      next[String(i)] = errs;
    });
    setErrors(next);
    return allValid;
  };

  useImperativeHandle(ref, () => ({
    validate,
    focusFirstError: () => {
      for (let i = 0; i < items.length; i++) {
        const errs = errors[String(i)] || {};
        const fields: (keyof CustomsItem)[] = ['description', 'quantity', 'value', 'origin', 'hsCode'];
        for (const f of fields) {
          if (errs[f]) {
            inputRefs.current[`${i}-${f}`]?.focus();
            return;
          }
        }
      }
    },
  }), [errors, items]);

  useEffect(() => {
    const hasTouched = Object.values(touched).some((t) => Object.values(t).some(Boolean));
    if (hasTouched) validate();
  }, [items, touched]);

  const updateItem = (idx: number, patch: Partial<CustomsItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    set({ items: next });
  };

  const markTouched = (idx: number, key: keyof CustomsItem) => {
    setTouched((t) => {
      const ti = String(idx);
      return { ...t, [ti]: { ...(t[ti] || {}), [key]: true } };
    });
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
        <PressableScale
          style={styles.aiBtn}
          onPress={() => {
            Haptics.medium();
            classifyAll();
          }}
          disabled={aiBusy}
          haptic="medium"
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
        </PressableScale>
      </View>

      {items.map((it, i) => {
        const idxKey = String(i);
        const errs = errors[idxKey] || {};
        const tch = touched[idxKey] || {};
        return (
          <Animated.View
            key={i}
            entering={FadeInDown.duration(360).delay(i * 70)}
            layout={LinearTransition.springify().damping(20).stiffness(220)}
            style={styles.itemCard}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>Item {i + 1}</Text>
              {items.length > 1 && (
                <PressableScale
                  onPress={() => {
                    Haptics.light();
                    removeItem(i);
                  }}
                  style={styles.xBtn}
                  haptic="light"
                  scaleTo={0.88}
                >
                  <Ionicons name="close" size={14} color="#6B6B76" />
                </PressableScale>
              )}
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description *</Text>
              <View style={[styles.inputWrap, tch.description && errs.description ? styles.inputWrapError : null]}>
                <TextInput
                  ref={(r) => { inputRefs.current[`${i}-description`] = r; }}
                  style={styles.input}
                  placeholder="Cotton t-shirt"
                  placeholderTextColor="#9A9AA4"
                  value={it.description}
                  onChangeText={(v) => { updateItem(i, { description: v }); markTouched(i, 'description'); }}
                  onBlur={() => markTouched(i, 'description')}
                  returnKeyType="next"
                />
              </View>
              {tch.description && errs.description ? (
                <Text style={styles.errorText}>{errs.description}</Text>
              ) : null}
            </View>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Qty *</Text>
                <View style={[styles.inputWrap, tch.quantity && errs.quantity ? styles.inputWrapError : null]}>
                  <TextInput
                    ref={(r) => { inputRefs.current[`${i}-quantity`] = r; }}
                    style={styles.input}
                    inputMode="numeric"
                    placeholder="1"
                    placeholderTextColor="#9A9AA4"
                    value={it.quantity}
                    onChangeText={(v) => { updateItem(i, { quantity: v }); markTouched(i, 'quantity'); }}
                    onBlur={() => markTouched(i, 'quantity')}
                    returnKeyType="next"
                  />
                </View>
                {tch.quantity && errs.quantity ? (
                  <Text style={styles.errorText}>{errs.quantity}</Text>
                ) : null}
              </View>
              <View style={[styles.field, { flex: 1.6 }]}>
                <Text style={styles.fieldLabel}>Value (CAD) *</Text>
                <View style={[styles.inputWrap, tch.value && errs.value ? styles.inputWrapError : null]}>
                  <TextInput
                    ref={(r) => { inputRefs.current[`${i}-value`] = r; }}
                    style={styles.input}
                    inputMode="decimal"
                    placeholder="0.00"
                    placeholderTextColor="#9A9AA4"
                    value={it.value}
                    onChangeText={(v) => { updateItem(i, { value: v }); markTouched(i, 'value'); }}
                    onBlur={() => markTouched(i, 'value')}
                    returnKeyType="next"
                  />
                </View>
                {tch.value && errs.value ? (
                  <Text style={styles.errorText}>{errs.value}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Origin *</Text>
                <View style={[styles.inputWrap, tch.origin && errs.origin ? styles.inputWrapError : null]}>
                  <TextInput
                    ref={(r) => { inputRefs.current[`${i}-origin`] = r; }}
                    style={styles.input}
                    placeholder="Canada"
                    placeholderTextColor="#9A9AA4"
                    value={it.origin}
                    onChangeText={(v) => { updateItem(i, { origin: v }); markTouched(i, 'origin'); }}
                    onBlur={() => markTouched(i, 'origin')}
                    returnKeyType="next"
                    autoComplete="country"
                    textContentType="countryName"
                  />
                </View>
                {tch.origin && errs.origin ? (
                  <Text style={styles.errorText}>{errs.origin}</Text>
                ) : null}
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>HS code</Text>
                <View style={[styles.inputWrap, tch.hsCode && errs.hsCode ? styles.inputWrapError : null]}>
                  <TextInput
                    ref={(r) => { inputRefs.current[`${i}-hsCode`] = r; }}
                    style={styles.input}
                    placeholder="6109.10"
                    placeholderTextColor="#9A9AA4"
                    value={it.hsCode}
                    onChangeText={(v) => { updateItem(i, { hsCode: v }); markTouched(i, 'hsCode'); }}
                    onBlur={() => markTouched(i, 'hsCode')}
                    keyboardType="number-pad"
                    returnKeyType="done"
                  />
                </View>
                {tch.hsCode && errs.hsCode ? (
                <Text style={styles.errorText}>{errs.hsCode}</Text>
              ) : null}
            </View>
            </View>
          </Animated.View>
        );
      })}

      <PressableScale style={styles.addBtn} onPress={() => { Haptics.light(); addItem(); }} haptic="light">
        <Ionicons name="add" size={17} color="#635BFF" />
        <Text style={styles.addBtnText}>Add another item</Text>
      </PressableScale>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Declared value</Text>
        <Text style={styles.totalValue}>${totalValue.toFixed(2)}</Text>
      </View>
    </View>
  );
});

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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(10,10,20,0.07)',
    backgroundColor: '#F7F7F9',
    paddingHorizontal: 15,
  },
  inputWrapError: {
    borderColor: '#E0483D',
    backgroundColor: '#FFF7F7',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0B0B12',
    padding: 0,
  },
  errorText: {
    fontSize: 12.5,
    color: '#E0483D',
    marginTop: 4,
    fontWeight: '500',
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
