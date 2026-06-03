import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/lib/queries';
import type { Address } from '@/types';

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

export default function AddressesScreen() {
  const { data: addresses, isLoading, refetch } = useAddresses();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const createAddr = useCreateAddress();
  const updateAddr = useUpdateAddress();
  const deleteAddr = useDeleteAddress();

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: '', name: '', company: '', address1: '', address2: '',
    city: '', provinceCode: 'ON', postalCode: '', countryCode: 'CA',
    phone: '', email: '', isResidential: false, isDefault: false,
  });

  const filtered = useMemo(() => {
    if (!addresses) return [];
    const q = search.toLowerCase();
    return addresses.filter(
      (a) => a.name.toLowerCase().includes(q) || a.address1.toLowerCase().includes(q) || a.city.toLowerCase().includes(q),
    );
  }, [addresses, search]);

  const openCreate = useCallback(() => {
    setEditId(null);
    setForm({ label: '', name: '', company: '', address1: '', address2: '', city: '', provinceCode: 'ON', postalCode: '', countryCode: 'CA', phone: '', email: '', isResidential: false, isDefault: false });
    setModal(true);
  }, []);

  const openEdit = useCallback((addr: Address) => {
    setEditId(addr._id);
    setForm({
      label: addr.label || '', name: addr.name, company: addr.company || '',
      address1: addr.address1, address2: addr.address2 || '',
      city: addr.city, provinceCode: addr.provinceCode, postalCode: addr.postalCode,
      countryCode: addr.countryCode, phone: addr.phone || '', email: addr.email || '',
      isResidential: addr.isResidential, isDefault: addr.isDefault,
    });
    setModal(true);
  }, []);

  const save = useCallback(async () => {
    const payload = { ...form };
    try {
      if (editId) {
        await updateAddr.mutateAsync({ id: editId, data: payload });
      } else {
        await createAddr.mutateAsync(payload);
      }
      setModal(false);
    } catch {}
  }, [form, editId, createAddr, updateAddr]);

  const doDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete address', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddr.mutate(id) },
    ]);
  }, [deleteAddr]);

  const busy = createAddr.isPending || updateAddr.isPending;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#0B0B12" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address Book</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color="#0B0B12" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color="#9A9AA4" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search addresses…"
          placeholderTextColor="#9A9AA4"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#635BFF" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="locate-outline" size={64} color="#ECEBFF" />
          <Text style={styles.emptyText}>
            {search ? 'No matching addresses' : 'No saved addresses'}
          </Text>
          <Text style={styles.emptySub}>
            {search ? 'Try a different search' : 'Add your first address'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listInner}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#635BFF" />}
        >
          {filtered.map((addr) => (
            <TouchableOpacity key={addr._id} style={styles.card} onPress={() => openEdit(addr)}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  {addr.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
                  {addr.label && <Text style={styles.cardLabel}>{addr.label}</Text>}
                </View>
                <TouchableOpacity onPress={() => doDelete(addr._id, addr.label || addr.name)}>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardName}>{addr.name}</Text>
              {addr.company ? <Text style={styles.cardDetail}>{addr.company}</Text> : null}
              <Text style={styles.cardDetail}>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</Text>
              <Text style={styles.cardDetail}>{addr.city}, {addr.provinceCode} {addr.postalCode}</Text>
              {addr.phone ? <Text style={styles.cardDetail}>{addr.phone}</Text> : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit address' : 'New address'}</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={20} color="#0B0B12" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyInner}>
              <Text style={styles.label}>Label</Text>
              <TextInput style={styles.input} value={form.label} onChangeText={(t) => setForm((f) => ({ ...f, label: t }))} placeholder="e.g. Office, Home" placeholderTextColor="#9A9AA4" />

              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} placeholder="Recipient name" placeholderTextColor="#9A9AA4" />

              <Text style={styles.label}>Company</Text>
              <TextInput style={styles.input} value={form.company} onChangeText={(t) => setForm((f) => ({ ...f, company: t }))} placeholder="Optional" placeholderTextColor="#9A9AA4" />

              <Text style={styles.label}>Address line 1 *</Text>
              <TextInput style={styles.input} value={form.address1} onChangeText={(t) => setForm((f) => ({ ...f, address1: t }))} placeholder="123 Main St" placeholderTextColor="#9A9AA4" />

              <Text style={styles.label}>Address line 2</Text>
              <TextInput style={styles.input} value={form.address2} onChangeText={(t) => setForm((f) => ({ ...f, address2: t }))} placeholder="Unit 4" placeholderTextColor="#9A9AA4" />

              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={form.city} onChangeText={(t) => setForm((f) => ({ ...f, city: t }))} placeholder="City" placeholderTextColor="#9A9AA4" />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Province</Text>
                  <View style={styles.pickerRow}>
                    {PROVINCES.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.pickerItem, form.provinceCode === p && styles.pickerItemActive]}
                        onPress={() => setForm((f) => ({ ...f, provinceCode: p }))}
                      >
                        <Text style={[styles.pickerText, form.provinceCode === p && styles.pickerTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Postal code *</Text>
                  <TextInput style={styles.input} value={form.postalCode} onChangeText={(t) => setForm((f) => ({ ...f, postalCode: t.toUpperCase() }))} placeholder="A1A 1A1" placeholderTextColor="#9A9AA4" autoCapitalize="characters" />
                </View>
              </View>

              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={form.phone} onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))} placeholder="+1 416 555 0123" placeholderTextColor="#9A9AA4" keyboardType="phone-pad" />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm((f) => ({ ...f, email: t }))} placeholder="email@example.com" placeholderTextColor="#9A9AA4" keyboardType="email-address" autoCapitalize="none" />

              {/* Toggles */}
              <TouchableOpacity style={styles.toggleRow} onPress={() => setForm((f) => ({ ...f, isResidential: !f.isResidential }))}>
                <Text style={styles.toggleLabel}>Residential address</Text>
                <View style={[styles.toggle, form.isResidential && styles.toggleOn]}>
                  <View style={[styles.toggleDot, form.isResidential && styles.toggleDotOn]} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toggleRow} onPress={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}>
                <Text style={styles.toggleLabel}>Set as default</Text>
                <View style={[styles.toggle, form.isDefault && styles.toggleOn]}>
                  <View style={[styles.toggleDot, form.isDefault && styles.toggleDotOn]} />
                </View>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalBtn} onPress={save} disabled={busy || !form.name || !form.address1 || !form.city || !form.postalCode}>
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalBtnText}>{editId ? 'Update' : 'Create'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0B0B12' },

  // List
  list: { flex: 1 },
  listInner: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  defaultBadge: { backgroundColor: '#ECEBFF', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 11, fontWeight: '600', color: '#635BFF' },
  cardLabel: { fontSize: 12.5, fontWeight: '600', color: '#9A9AA4' },
  cardName: { fontSize: 15, fontWeight: '600', color: '#0B0B12', marginTop: 6 },
  cardDetail: { fontSize: 13.5, color: '#6B6B76', marginTop: 1 },

  // Empty / Loading
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#0B0B12' },
  emptySub: { fontSize: 14, color: '#9A9AA4' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#F2F2F5', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,20,0.07)',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: {},
  modalBodyInner: { padding: 20, gap: 12, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B6B76', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0B0B12', borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  row: { flexDirection: 'row', gap: 12 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pickerItem: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  pickerItemActive: { backgroundColor: '#635BFF', borderColor: '#635BFF' },
  pickerText: { fontSize: 13, fontWeight: '600', color: '#6B6B76' },
  pickerTextActive: { color: '#fff' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: '#0B0B12' },
  toggle: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: '#E5E5EA',
    padding: 2, justifyContent: 'center',
  },
  toggleOn: { backgroundColor: '#635BFF' },
  toggleDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  toggleDotOn: { alignSelf: 'flex-end' },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(10,10,20,0.07)' },
  modalBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#635BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
