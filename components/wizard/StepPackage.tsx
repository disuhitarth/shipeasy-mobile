import { View, Text, StyleSheet, TextInput } from 'react-native';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import type { WizardState } from './types';
import { PACKAGE_TYPES, WEIGHT_UNITS, DIM_UNITS } from './types';
import { validateWeight, validateDimensions } from '@/lib/validation';
import { PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';

export interface StepPackageRef {
  validate: () => boolean;
  focusFirstError: () => void;
}

interface Props {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
  onOpenSku: () => void;
}

export const StepPackage = forwardRef<StepPackageRef, Props>(function StepPackage({ state, set, onOpenSku }, ref) {
  const [errors, setErrors] = useState<{ weight?: string; dimensions?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const weightRef = useRef<TextInput>(null);
  const lengthRef = useRef<TextInput>(null);
  const widthRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);

  const unit = state.weightUnit as 'kg' | 'lb';
  const dimUnit = state.dimUnit as 'cm' | 'in';

  const validate = (): boolean => {
    const w = parseFloat(state.weight);
    const wErr = validateWeight(w, unit);
    const l = parseFloat(state.length);
    const wid = parseFloat(state.width);
    const h = parseFloat(state.height);
    const dErr = validateDimensions(l, wid, h, dimUnit);
    const next: typeof errors = {};
    if (wErr) next.weight = wErr;
    if (dErr) next.dimensions = dErr;
    setErrors(next);
    return !next.weight && !next.dimensions;
  };

  useImperativeHandle(ref, () => ({
    validate,
    focusFirstError: () => {
      if (errors.weight) weightRef.current?.focus();
      else if (errors.dimensions) lengthRef.current?.focus();
    },
  }), [errors]);

  useEffect(() => {
    if (touched.weight || touched.length || touched.width || touched.height) {
      validate();
    }
  }, [state.weight, state.length, state.width, state.height, state.weightUnit, state.dimUnit, touched.weight, touched.length, touched.width, touched.height]);

  return (
    <View style={styles.container}>
      {state.appliedSku ? (
        <PressableScale style={styles.skuApplied} onPress={onOpenSku} haptic="light">
          <View style={styles.skuAvatar}>
            <Text style={styles.skuEmoji}>
              {state.appliedSku.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.skuInfo}>
            <View style={styles.skuLabelRow}>
              <Text style={styles.skuName}>{state.appliedSku.name}</Text>
              <Text style={styles.tagPill}>SKU</Text>
            </View>
            <Text style={styles.skuMeta}>Auto-filled · {state.appliedSku.sku}</Text>
          </View>
          <Text style={styles.changeText}>Change</Text>
        </PressableScale>
      ) : (
        <PressableScale style={styles.quickSku} onPress={onOpenSku} haptic="light">
          <View style={styles.quickSkuIcon}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickSkuLabel}>Quick add SKU</Text>
            <Text style={styles.quickSkuSub}>Skip the form — fill from a saved product</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9A9AA4" />
        </PressableScale>
      )}

      <View style={styles.divider}>
        <Text style={styles.dividerText}>
          {state.appliedSku ? 'or edit manually' : 'or enter manually'}
        </Text>
      </View>

      <Text style={styles.eyebrow}>Package type</Text>
      <View style={styles.typeGrid}>
        {PACKAGE_TYPES.map((t, i) => (
          <Animated.View
            key={t}
            entering={FadeInDown.duration(360).delay(i * 60)}
            style={{ flex: 1 }}
          >
            <PressableScale
              style={[styles.typeCard, state.packageType === t && styles.typeCardSel]}
              onPress={() => {
                Haptics.light();
                set({ packageType: t });
              }}
              haptic="light"
            >
              <Ionicons
                name={t === 'Box / Parcel' ? 'cube' : t === 'Soft pack' ? 'gift' : 'document'}
                size={24}
                color={state.packageType === t ? '#635BFF' : '#6B6B76'}
              />
              <Text style={[styles.typeLabel, state.packageType === t && styles.typeLabelSel]}>
                {t}
              </Text>
            </PressableScale>
          </Animated.View>
        ))}
      </View>

      <View style={styles.weightCard}>
        <View style={styles.weightHeader}>
          <Text style={styles.weightLabel}>Weight *</Text>
          <View style={styles.unitSeg}>
            {WEIGHT_UNITS.map((u) => (
              <PressableScale
                key={u}
                style={[styles.unitBtn, state.weightUnit === u && styles.unitBtnOn]}
                onPress={() => {
                  Haptics.light();
                  set({ weightUnit: u });
                }}
                haptic="light"
                scaleTo={0.92}
              >
                <Text style={[styles.unitText, state.weightUnit === u && styles.unitTextOn]}>
                  {u}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>
        <View style={styles.bigInput}>
          <TextInput
            ref={weightRef}
            style={[styles.bigField, errors.weight && touched.weight ? styles.bigFieldError : null]}
            inputMode="decimal"
            placeholder="0.0"
            placeholderTextColor="#9A9AA4"
            value={state.weight}
            onChangeText={(v) => { set({ weight: v }); setTouched((t) => ({ ...t, weight: true })); }}
            onBlur={() => setTouched((t) => ({ ...t, weight: true }))}
            returnKeyType="next"
            onSubmitEditing={() => lengthRef.current?.focus()}
          />
          <Text style={styles.bigUnit}>{state.weightUnit}</Text>
        </View>
        {touched.weight && errors.weight ? (
          <Text style={styles.errorText}>{errors.weight}</Text>
        ) : null}
      </View>

      <View style={styles.dimsCard}>
        <View style={styles.dimsHeader}>
          <Text style={styles.weightLabel}>Dimensions</Text>
          <View style={styles.unitSeg}>
            {DIM_UNITS.map((u) => (
              <PressableScale
                key={u}
                style={[styles.unitBtn, state.dimUnit === u && styles.unitBtnOn]}
                onPress={() => {
                  Haptics.light();
                  set({ dimUnit: u });
                }}
                haptic="light"
                scaleTo={0.92}
              >
                <Text style={[styles.unitText, state.dimUnit === u && styles.unitTextOn]}>
                  {u}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>
        <View style={styles.dimsRow}>
          {(['length', 'width', 'height'] as const).map((k) => (
            <View key={k} style={styles.dimField}>
              <TextInput
                ref={k === 'length' ? lengthRef : k === 'width' ? widthRef : heightRef}
                style={styles.dimInput}
                inputMode="decimal"
                placeholder="0"
                placeholderTextColor="#9A9AA4"
                value={state[k]}
                onChangeText={(v) => { set({ [k]: v }); setTouched((t) => ({ ...t, [k]: true })); }}
                onBlur={() => setTouched((t) => ({ ...t, [k]: true }))}
                returnKeyType={k === 'height' ? 'done' : 'next'}
                onSubmitEditing={() => {
                  if (k === 'length') widthRef.current?.focus();
                  else if (k === 'width') heightRef.current?.focus();
                }}
              />
              <Text style={styles.dimLabel}>
                {k === 'length' ? 'L' : k === 'width' ? 'W' : 'H'}
              </Text>
            </View>
          ))}
        </View>
        {touched.length && errors.dimensions ? (
          <Text style={styles.errorText}>{errors.dimensions}</Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 16 },
  skuApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: '#ECEBFF',
    borderRadius: 14,
  },
  skuAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skuEmoji: { fontSize: 18, color: '#fff', fontWeight: '700' },
  skuInfo: { flex: 1 },
  skuLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skuName: { fontSize: 14.5, fontWeight: '600' },
  tagPill: {
    fontSize: 10.5,
    fontWeight: '600',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#635BFF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  skuMeta: { fontSize: 12.5, color: '#9A9AA4', marginTop: 2 },
  changeText: { fontSize: 12.5, fontWeight: '600', color: '#635BFF' },
  quickSku: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  quickSkuIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSkuLabel: { fontSize: 14.5, fontWeight: '600' },
  quickSkuSub: { fontSize: 12.5, color: '#9A9AA4', marginTop: 1 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerText: { color: '#9A9AA4', fontSize: 12, fontWeight: '600' },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#9A9AA4',
  },
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 9,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeCardSel: { borderColor: '#635BFF' },
  typeLabel: { fontSize: 12, fontWeight: '600', color: '#0B0B12' },
  typeLabelSel: { color: '#635BFF' },
  weightCard: { backgroundColor: '#fff', borderRadius: 22, padding: 16 },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightLabel: { fontSize: 14.5, fontWeight: '600' },
  unitSeg: { flexDirection: 'row', backgroundColor: '#F7F7F9', borderRadius: 10, padding: 2 },
  unitBtn: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnOn: { backgroundColor: '#fff' },
  unitText: { fontSize: 12, fontWeight: '600', color: '#6B6B76' },
  unitTextOn: { color: '#0B0B12' },
  bigInput: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bigField: {
    flex: 1,
    fontSize: 46,
    fontWeight: '700',
    letterSpacing: -2,
    color: '#0B0B12',
    padding: 0,
  },
  bigFieldError: {
    color: '#E0483D',
  },
  bigUnit: { fontSize: 22, fontWeight: '600', color: '#9A9AA4' },
  errorText: {
    fontSize: 12.5,
    color: '#E0483D',
    marginTop: 6,
    fontWeight: '500',
  },
  dimsCard: { backgroundColor: '#fff', borderRadius: 22, padding: 16 },
  dimsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dimsRow: { flexDirection: 'row', gap: 10 },
  dimField: { flex: 1, alignItems: 'center', gap: 6 },
  dimInput: {
    width: '100%',
    height: 56,
    textAlign: 'center',
    borderRadius: 14,
    backgroundColor: '#F7F7F9',
    borderWidth: 1,
    borderColor: 'rgba(10,10,20,0.07)',
    fontSize: 22,
    fontWeight: '700',
    color: '#0B0B12',
  },
  dimLabel: { fontSize: 12, fontWeight: '600', color: '#9A9AA4' },
});
