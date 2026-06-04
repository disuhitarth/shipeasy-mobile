import { View, Text, StyleSheet, TextInput } from 'react-native';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useAddresses } from '@/lib/queries';
import type { WizardState } from './types';
import { FormField } from '@/components/ui/FormField';
import { PressableScale } from '@/components/PressableScale';
import { validateName, validateCity, validatePostalCode, validateRequired, validateForm } from '@/lib/validation';
import * as Haptics from '@/lib/haptics';

export interface StepAddressRef {
  validate: () => boolean;
  focusFirstError: () => void;
}

interface Props {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}

export const StepAddress = forwardRef<StepAddressRef, Props>(function StepAddress({ state, set }, ref) {
  const { data: addresses } = useAddresses();
  const from = addresses?.find(a => a._id === state.fromId);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const nameRef = useRef<TextInput>(null);
  const lineRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const provinceRef = useRef<TextInput>(null);
  const postalRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const r = validateForm(state, {
      toName: validateName,
      toLine: (v) => validateRequired(String(v ?? ''), 'Street address'),
      toCity: validateCity,
      toPostal: (v) => validatePostalCode(String(v ?? ''), state.toCountry || 'CA'),
    });
    setErrors(r.errors);
    return r.isValid;
  };

  useImperativeHandle(ref, () => ({
    validate,
    focusFirstError: () => {
      const order: (keyof WizardState)[] = ['toName', 'toLine', 'toCity', 'toPostal'];
      for (const k of order) {
        if (errors[k]) {
          const map: Partial<Record<keyof WizardState, React.RefObject<TextInput | null>>> = {
            toName: nameRef, toLine: lineRef, toCity: cityRef, toPostal: postalRef,
          };
          map[k]?.current?.focus();
          break;
        }
      }
    },
  }), [errors]);

  useEffect(() => {
    if (touched.toName || touched.toLine || touched.toCity || touched.toPostal) {
      validate();
    }
  }, [state.toName, state.toLine, state.toCity, state.toProvince, state.toPostal, state.toCountry, touched.toName, touched.toLine, touched.toCity, touched.toPostal]);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Ship from</Text>
      {addresses && addresses.length > 0 ? (
        addresses.map((addr, i) => (
          <Animated.View
            key={addr._id}
            entering={FadeInDown.duration(360).delay(i * 60)}
            layout={LinearTransition.springify().damping(20).stiffness(220)}
          >
            <PressableScale
              style={[styles.addrCard, state.fromId === addr._id && styles.addrSel]}
              onPress={() => {
                Haptics.light();
                set({ fromId: addr._id });
              }}
              haptic="light"
            >
              <View style={styles.addrIcon}>
                <Ionicons name="location" size={18} color="#635BFF" />
              </View>
              <View style={styles.addrInfo}>
                <View style={styles.addrLabelRow}>
                  <Text style={styles.addrLabel}>{addr.label || addr.name}</Text>
                  <Text style={styles.tagPill}>Sender</Text>
                </View>
                <Text style={styles.addrLine} numberOfLines={1}>
                  {addr.address1}, {addr.city}
                </Text>
              </View>
              <View style={[styles.radio, state.fromId === addr._id && styles.radioOn]} />
            </PressableScale>
          </Animated.View>
        ))
      ) : (
        <PressableScale style={styles.addBtn} haptic="light">
          <Ionicons name="add" size={17} color="#635BFF" />
          <Text style={styles.addBtnText}>Add sender address</Text>
        </PressableScale>
      )}

      <Text style={[styles.eyebrow, { marginTop: 16 }]}>Ship to</Text>
      <View style={styles.formCard}>
        <FormField
          ref={nameRef}
          label="Recipient name"
          value={state.toName}
          onChangeText={(v) => { set({ toName: v }); setTouched((t) => ({ ...t, toName: true })); }}
          placeholder="Priya Sharma"
          error={touched.toName ? errors.toName : null}
          required
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => lineRef.current?.focus()}
        />
        <FormField
          ref={lineRef}
          label="Street address"
          value={state.toLine}
          onChangeText={(v) => { set({ toLine: v }); setTouched((t) => ({ ...t, toLine: true })); }}
          placeholder="1450 Howe St"
          error={touched.toLine ? errors.toLine : null}
          required
          autoCapitalize="words"
          autoComplete="address-line1"
          textContentType="streetAddressLine1"
          returnKeyType="next"
          onSubmitEditing={() => cityRef.current?.focus()}
        />
        <View style={styles.row}>
          <View style={[styles.col, { flex: 1.4 }]}>
            <FormField
              ref={cityRef}
              label="City"
              value={state.toCity}
              onChangeText={(v) => { set({ toCity: v }); setTouched((t) => ({ ...t, toCity: true })); }}
              placeholder="Vancouver"
              error={touched.toCity ? errors.toCity : null}
              required
              autoCapitalize="words"
              autoComplete="postal-address-locality"
              textContentType="addressCity"
              returnKeyType="next"
              onSubmitEditing={() => provinceRef.current?.focus()}
            />
          </View>
          <View style={[styles.col, { flex: 1 }]}>
            <FormField
              ref={provinceRef}
              label="Province"
              value={state.toProvince}
              onChangeText={(v) => set({ toProvince: v.toUpperCase() })}
              placeholder="BC"
              autoCapitalize="characters"
              autoComplete="postal-address-region"
              textContentType="addressState"
              maxLength={2}
              returnKeyType="next"
              onSubmitEditing={() => postalRef.current?.focus()}
            />
          </View>
        </View>
        <FormField
          ref={postalRef}
          label="Postal code"
          value={state.toPostal}
          onChangeText={(v) => { set({ toPostal: v.toUpperCase() }); setTouched((t) => ({ ...t, toPostal: true })); }}
          placeholder="V6Z 1R8"
          error={touched.toPostal ? errors.toPostal : null}
          required
          autoCapitalize="characters"
          autoComplete="postal-code"
          textContentType="postalCode"
          returnKeyType="done"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 12 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#9A9AA4',
    marginBottom: 2,
  },
  addrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  addrSel: { borderColor: '#635BFF' },
  addrIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#ECEBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrInfo: { flex: 1 },
  addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addrLabel: { fontSize: 15, fontWeight: '600' },
  tagPill: {
    fontSize: 10.5,
    fontWeight: '600',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#ECEBFF',
    color: '#635BFF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  addrLine: { fontSize: 13, color: '#9A9AA4', marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(10,10,20,0.07)',
  },
  radioOn: {
    borderColor: '#635BFF',
    backgroundColor: '#635BFF',
  },
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
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    gap: 13,
  },
  row: { flexDirection: 'row', gap: 12 },
  col: {},
});
