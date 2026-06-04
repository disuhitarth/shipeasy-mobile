import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useSKUs, useCreateSKU, useUpdateSKU, useDeleteSKU } from '@/lib/queries';
import type { SKU } from '@/types';
import { colors, spacing, borderRadius } from '@/lib/theme';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SKU Manager</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.faint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search SKUs or products…"
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="pricetags-outline" size={64} color={colors.accentSoft} />
          <Text style={styles.emptyText}>
            {search ? 'No matching SKUs' : 'No SKUs yet'}
          </Text>
          <Text style={styles.emptySub}>
            {search ? 'Try a different search' : 'Create your first product preset'}
          </Text>
          {!search && (
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.emptyBtnText}>Create SKU</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listInner}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((s) => (
            <TouchableOpacity key={s._id} style={styles.card} onPress={() => openEdit(s)} activeOpacity={0.7}>
              <View style={styles.cardTop}>
                <View style={styles.skuBadge}>
                  <Text style={styles.skuBadgeText}>{s.sku}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => doDelete(s._id, s.name)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.red} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardName}>{s.name}</Text>
              {s.description ? <Text style={styles.cardDesc} numberOfLines={2}>{s.description}</Text> : null}
              <View style={styles.metaGrid}>
                {s.hsCode ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="barcode-outline" size={14} color={colors.faint} />
                    <Text style={styles.metaText}>HS {s.hsCode}</Text>
                  </View>
                ) : null}
                {s.countryOfOrigin ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="globe-outline" size={14} color={colors.faint} />
                    <Text style={styles.metaText}>{s.countryOfOrigin}</Text>
                  </View>
                ) : null}
                {s.defaultValue ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={14} color={colors.faint} />
                    <Text style={styles.metaText}>${s.defaultValue}</Text>
                  </View>
                ) : null}
                {s.defaultQuantity ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="layers-outline" size={14} color={colors.faint} />
                    <Text style={styles.metaText}>Qty {s.defaultQuantity}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cardToggles}>
                {s.requiresSignature && (
                  <View style={styles.toggleBadge}>
                    <Ionicons name="create-outline" size={12} color={colors.accent} />
                    <Text style={styles.toggleBadgeText}>Signature</Text>
                  </View>
                )}
                {s.requiresInsurance && (
                  <View style={styles.toggleBadge}>
                    <Ionicons name="shield-checkmark-outline" size={12} color={colors.accent} />
                    <Text style={styles.toggleBadgeText}>Insurance</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.grabHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit SKU' : 'New SKU'}</Text>
              <TouchableOpacity onPress={() => setModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyInner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>SKU code</Text>
              <TextInput style={styles.input} value={form.sku} onChangeText={(t) => setForm((f) => ({ ...f, sku: t.toUpperCase() }))} placeholder="e.g. TSHIRT-BLK-M" placeholderTextColor={colors.faint} autoCapitalize="characters" editable={!editId} />

              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} placeholder="Product name" placeholderTextColor={colors.faint} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.inputMulti]} value={form.description} onChangeText={(t) => setForm((f) => ({ ...f, description: t }))} placeholder="Optional description" placeholderTextColor={colors.faint} multiline textAlignVertical="top" />

              <Text style={styles.label}>HS Code</Text>
              <TextInput style={styles.input} value={form.hsCode} onChangeText={(t) => setForm((f) => ({ ...f, hsCode: t }))} placeholder="e.g. 6109.10.00" placeholderTextColor={colors.faint} />

              <Text style={styles.label}>Country of origin</Text>
              <TextInput style={styles.input} value={form.countryOfOrigin} onChangeText={(t) => setForm((f) => ({ ...f, countryOfOrigin: t }))} placeholder="e.g. Canada" placeholderTextColor={colors.faint} />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Default value</Text>
                  <TextInput style={styles.input} value={form.defaultValue} onChangeText={(t) => setForm((f) => ({ ...f, defaultValue: t }))} placeholder="$0.00" placeholderTextColor={colors.faint} keyboardType="decimal-pad" />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Default quantity</Text>
                  <TextInput style={styles.input} value={form.defaultQuantity} onChangeText={(t) => setForm((f) => ({ ...f, defaultQuantity: t }))} placeholder="1" placeholderTextColor={colors.faint} keyboardType="number-pad" />
                </View>
              </View>

              <View style={styles.toggleGroup}>
                <TouchableOpacity style={styles.toggleRow} onPress={() => setForm((f) => ({ ...f, requiresSignature: !f.requiresSignature }))}>
                  <View style={styles.toggleLabelGroup}>
                    <Ionicons name="create-outline" size={18} color={colors.muted} />
                    <Text style={styles.toggleLabel}>Requires signature</Text>
                  </View>
                  <View style={[styles.toggle, form.requiresSignature && styles.toggleOn]}>
                    <View style={[styles.toggleDot, form.requiresSignature && styles.toggleDotOn]} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleRow} onPress={() => setForm((f) => ({ ...f, requiresInsurance: !f.requiresInsurance }))}>
                  <View style={styles.toggleLabelGroup}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.muted} />
                    <Text style={styles.toggleLabel}>Requires insurance</Text>
                  </View>
                  <View style={[styles.toggle, form.requiresInsurance && styles.toggleOn]}>
                    <View style={[styles.toggleDot, form.requiresInsurance && styles.toggleDotOn]} />
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalBtn} onPress={save} disabled={busy || !form.sku || !form.name}>
                {busy ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.modalBtnText}>{editId ? 'Update SKU' : 'Create SKU'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(10,10,25,0.04)', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 2, elevation: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, height: 44,
    shadowColor: 'rgba(10,10,25,0.04)', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 2, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink },

  list: { flex: 1 },
  listInner: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg,
    shadowColor: 'rgba(10,10,25,0.06)', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1, shadowRadius: 24, elevation: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skuBadge: {
    backgroundColor: colors.accentSoft, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  skuBadgeText: {
    fontSize: 11.5, fontWeight: '600', letterSpacing: 0.4,
    fontFamily: 'ui-monospace', color: colors.accent,
  },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.ink, marginTop: spacing.sm },
  cardDesc: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },

  metaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface2, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  metaText: { fontSize: 12.5, color: colors.muted, fontWeight: '500' },

  cardToggles: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  toggleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accentSoft, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  toggleBadgeText: { fontSize: 11.5, fontWeight: '600', color: colors.accent },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.ink },
  emptySub: { fontSize: 14, color: colors.faint },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.accent, borderRadius: borderRadius.sm,
    paddingHorizontal: 20, paddingVertical: 14, marginTop: spacing.sm,
  },
  emptyBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  grabHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(60,60,67,0.18)',
    alignSelf: 'center', marginTop: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  modalBody: {},
  modalBodyInner: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg, height: 50,
    fontSize: 15, color: colors.ink,
    borderWidth: 1, borderColor: colors.hairline,
  },
  inputMulti: { minHeight: 80, paddingTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfField: { flex: 1 },

  toggleGroup: { gap: spacing.sm, marginTop: spacing.xs },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg, height: 54,
    borderWidth: 1, borderColor: colors.hairline,
  },
  toggleLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: '#E5E5EA',
    padding: 2, justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.accent },
  toggleDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  toggleDotOn: { alignSelf: 'flex-end' },

  modalFooter: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  modalBtn: {
    height: 52, borderRadius: borderRadius.sm, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
