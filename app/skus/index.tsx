import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useSKUs, useCreateSKU, useUpdateSKU, useDeleteSKU } from '@/lib/queries';
import type { SKU } from '@/types';

export default function SKUsScreen() {
  const { data: skus, isLoading, refetch } = useSKUs();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const createSku = useCreateSKU();
  const updateSku = useUpdateSKU();
  const deleteSku = useDeleteSKU();

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku: '', name: '', description: '', hsCode: '', countryOfOrigin: '',
    defaultValue: '', defaultQuantity: '1',
    requiresSignature: false, requiresInsurance: false,
  });

  const filtered = useMemo(() => {
    if (!skus) return [];
    const q = search.toLowerCase();
    return skus.filter(
      (s) => s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [skus, search]);

  const openCreate = useCallback(() => {
    setEditId(null);
    setForm({ sku: '', name: '', description: '', hsCode: '', countryOfOrigin: '', defaultValue: '', defaultQuantity: '1', requiresSignature: false, requiresInsurance: false });
    setModal(true);
  }, []);

  const openEdit = useCallback((sku: SKU) => {
    setEditId(sku._id);
    setForm({
      sku: sku.sku, name: sku.name, description: sku.description,
      hsCode: sku.hsCode, countryOfOrigin: sku.countryOfOrigin,
      defaultValue: String(sku.defaultValue || ''),
      defaultQuantity: String(sku.defaultQuantity || '1'),
      requiresSignature: sku.requiresSignature,
      requiresInsurance: sku.requiresInsurance,
    });
    setModal(true);
  }, []);

  const save = useCallback(async () => {
    const payload = {
      sku: form.sku.toUpperCase(),
      name: form.name,
      description: form.description,
      hsCode: form.hsCode,
      countryOfOrigin: form.countryOfOrigin,
      defaultValue: parseFloat(form.defaultValue) || undefined,
      defaultQuantity: parseInt(form.defaultQuantity) || 1,
      requiresSignature: form.requiresSignature,
      requiresInsurance: form.requiresInsurance,
    };
    try {
      if (editId) {
        await updateSku.mutateAsync({ id: editId, data: payload });
      } else {
        await createSku.mutateAsync(payload);
      }
      setModal(false);
    } catch {}
  }, [form, editId, createSku, updateSku]);

  const doDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete SKU', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSku.mutate(id) },
    ]);
  }, [deleteSku]);

  const busy = createSku.isPending || updateSku.isPending || deleteSku.isPending;

  const ddpColor = (status: string) => {
    switch (status) {
      case 'approved': return '#34C759';
      case 'pending': return '#FF9500';
      case 'failed': return '#FF3B30';
      default: return '#9A9AA4';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#0B0B12" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SKU Manager</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color="#0B0B12" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color="#9A9AA4" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search SKUs or products…"
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
          <Ionicons name="pricetags-outline" size={64} color="#ECEBFF" />
          <Text style={styles.emptyText}>
            {search ? 'No matching SKUs' : 'No SKUs yet'}
          </Text>
          <Text style={styles.emptySub}>
            {search ? 'Try a different search' : 'Create your first product preset'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listInner}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#635BFF" />}
        >
          {filtered.map((sku) => (
            <TouchableOpacity key={sku._id} style={styles.card} onPress={() => openEdit(sku)}>
              <View style={styles.cardTop}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{sku.sku}</Text>
                </View>
                <TouchableOpacity onPress={() => doDelete(sku._id, sku.name)}>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardName}>{sku.name}</Text>
              <View style={styles.cardMeta}>
                {sku.hsCode && <Text style={styles.cardMetaText}>HS {sku.hsCode}</Text>}
                {sku.ddpStatus && (
                  <View style={[styles.ddpBadge, { backgroundColor: ddpColor(sku.ddpStatus) + '20' }]}>
                    <Text style={[styles.ddpText, { color: ddpColor(sku.ddpStatus) }]}>
                      {sku.ddpStatus}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit SKU' : 'New SKU'}</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={20} color="#0B0B12" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyInner}>
              <Text style={styles.label}>SKU code *</Text>
              <TextInput style={styles.input} value={form.sku} onChangeText={(t) => setForm((f) => ({ ...f, sku: t.toUpperCase() }))} placeholder="e.g. TSHIRT-BLK-M" placeholderTextColor="#9A9AA4" autoCapitalize="characters" editable={!editId} />

              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} placeholder="Product name" placeholderTextColor="#9A9AA4" />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.inputMulti]} value={form.description} onChangeText={(t) => setForm((f) => ({ ...f, description: t }))} placeholder="Optional description" placeholderTextColor="#9A9AA4" multiline />

              <Text style={styles.label}>HS Code</Text>
              <TextInput style={styles.input} value={form.hsCode} onChangeText={(t) => setForm((f) => ({ ...f, hsCode: t }))} placeholder="e.g. 6109.10.00" placeholderTextColor="#9A9AA4" />

              <Text style={styles.label}>Country of origin</Text>
              <TextInput style={styles.input} value={form.countryOfOrigin} onChangeText={(t) => setForm((f) => ({ ...f, countryOfOrigin: t }))} placeholder="e.g. Canada" placeholderTextColor="#9A9AA4" />

              <Text style={styles.label}>Default value ($)</Text>
              <TextInput style={styles.input} value={form.defaultValue} onChangeText={(t) => setForm((f) => ({ ...f, defaultValue: t }))} placeholder="0.00" placeholderTextColor="#9A9AA4" keyboardType="decimal-pad" />

              <Text style={styles.label}>Default quantity</Text>
              <TextInput style={styles.input} value={form.defaultQuantity} onChangeText={(t) => setForm((f) => ({ ...f, defaultQuantity: t }))} placeholder="1" placeholderTextColor="#9A9AA4" keyboardType="number-pad" />

              {/* Toggles */}
              <TouchableOpacity style={styles.toggleRow} onPress={() => setForm((f) => ({ ...f, requiresSignature: !f.requiresSignature }))}>
                <Text style={styles.toggleLabel}>Requires signature</Text>
                <View style={[styles.toggle, form.requiresSignature && styles.toggleOn]}>
                  <View style={[styles.toggleDot, form.requiresSignature && styles.toggleDotOn]} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toggleRow} onPress={() => setForm((f) => ({ ...f, requiresInsurance: !f.requiresInsurance }))}>
                <Text style={styles.toggleLabel}>Requires insurance</Text>
                <View style={[styles.toggle, form.requiresInsurance && styles.toggleOn]}>
                  <View style={[styles.toggleDot, form.requiresInsurance && styles.toggleDotOn]} />
                </View>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalBtn} onPress={save} disabled={busy || !form.sku || !form.name}>
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
  cardBadge: { backgroundColor: '#ECEBFF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  cardBadgeText: { fontSize: 12, fontWeight: '700', color: '#635BFF', letterSpacing: 0.3 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#0B0B12', marginTop: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  cardMetaText: { fontSize: 12.5, color: '#6B6B76' },
  ddpBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  ddpText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

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
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  unitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)',
  },
  unitBtnText: { fontSize: 15, fontWeight: '600', color: '#0B0B12' },
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
