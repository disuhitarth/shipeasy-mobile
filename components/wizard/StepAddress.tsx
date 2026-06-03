import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAddresses } from '@/lib/queries';
import type { WizardState } from './types';

interface Props {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}

export function StepAddress({ state, set }: Props) {
  const { data: addresses } = useAddresses();
  const from = addresses?.find(a => a._id === state.fromId);

  return (
    <View style={styles.container}>
      {/* FROM section */}
      <Text style={styles.eyebrow}>Ship from</Text>
      {addresses && addresses.length > 0 ? (
        addresses.map((addr) => (
          <TouchableOpacity
            key={addr._id}
            style={[styles.addrCard, state.fromId === addr._id && styles.addrSel]}
            onPress={() => set({ fromId: addr._id })}
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
          </TouchableOpacity>
        ))
      ) : (
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={17} color="#635BFF" />
          <Text style={styles.addBtnText}>Add sender address</Text>
        </TouchableOpacity>
      )}

      {/* TO section */}
      <Text style={[styles.eyebrow, { marginTop: 16 }]}>Ship to</Text>
      <View style={styles.formCard}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Recipient name</Text>
          <TextInput
            style={styles.input}
            placeholder="Priya Sharma"
            placeholderTextColor="#9A9AA4"
            value={state.toName}
            onChangeText={(v) => set({ toName: v })}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Street address</Text>
          <TextInput
            style={styles.input}
            placeholder="1450 Howe St"
            placeholderTextColor="#9A9AA4"
            value={state.toLine}
            onChangeText={(v) => set({ toLine: v })}
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1.4 }]}>
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Vancouver"
              placeholderTextColor="#9A9AA4"
              value={state.toCity}
              onChangeText={(v) => set({ toCity: v })}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Province</Text>
            <TextInput
              style={styles.input}
              placeholder="BC"
              placeholderTextColor="#9A9AA4"
              value={state.toProvince}
              onChangeText={(v) => set({ toProvince: v })}
            />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Postal code</Text>
          <TextInput
            style={styles.input}
            placeholder="V6Z 1R8"
            placeholderTextColor="#9A9AA4"
            value={state.toPostal}
            onChangeText={(v) => set({ toPostal: v })}
            autoCapitalize="characters"
          />
        </View>
      </View>
    </View>
  );
}

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
  field: { gap: 7 },
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
});
