import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Alert, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/lib/queries';
import type { Address } from '@/types';
import { colors, spacing, borderRadius } from '@/lib/theme';

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

export default function AddressesScreen() {
  const { data: addresses, isLoading, refetch } = useAddresses();
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

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

  const renderField = (label: string, key: keyof typeof form, placeholder: string, opts?: { required?: boolean; keyboardType?: any; autoCapitalize?: any; extra?: React.ReactNode }) => (
    <View>
      <Text style={styles.fieldLabel}>{label}{opts?.required ? ' *' : ''}</Text>
      <TextInput
        style={styles.fieldInput}
        value={form[key] as string}
        onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={opts?.keyboardType}
        autoCapitalize={opts?.autoCapitalize}
      />
      {opts?.extra}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address Book</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchRow, searchFocused && styles.searchRowFocused]}>
          <Ionicons name="search" size={18} color={colors.faint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search addresses…"
            placeholderTextColor={colors.faint}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.faint} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="locate-outline" size={40} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>
            {search ? 'No matching addresses' : 'No saved addresses'}
          </Text>
          <Text style={styles.emptySub}>
            {search ? 'Try a different search term' : 'Tap + to add your first address'}
          </Text>
          {!search && (
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.emptyBtnText}>Add Address</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listInner}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((addr) => (
            <TouchableOpacity key={addr._id} style={styles.card} onPress={() => openEdit(addr)} activeOpacity={0.7}>
              <View style={styles.cardTags}>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
                {addr.label && !addr.isDefault && (
                  <Text style={styles.cardLabel}>{addr.label}</Text>
                )}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{addr.name}</Text>
                  {addr.company ? <Text style={styles.cardCompany}>{addr.company}</Text> : null}
                  <Text style={styles.cardAddr}>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</Text>
                  <Text style={styles.cardAddr}>{addr.city}, {addr.provinceCode} {addr.postalCode}</Text>
                  {addr.phone ? <Text style={styles.cardPhone}>{addr.phone}</Text> : null}
                </View>
                <TouchableOpacity style={styles.cardDelete} onPress={() => doDelete(addr._id, addr.label || addr.name)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.red} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal visible={modal} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => setModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.grabHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Address' : 'New Address'}</Text>
              <TouchableOpacity onPress={() => setModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyInner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {renderField('Label', 'label', 'e.g. Office, Home')}
              {renderField('Name', 'name', 'Recipient name', { required: true })}
              {renderField('Company', 'company', 'Optional')}
              {renderField('Address line 1', 'address1', '123 Main St', { required: true })}
              {renderField('Address line 2', 'address2', 'Unit 4')}
              {renderField('City', 'city', 'Toronto', { required: true })}
              <View>
                <Text style={styles.fieldLabel}>Province</Text>
                <View style={styles.provinceRow}>
                  {PROVINCES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.provincePill, form.provinceCode === p && styles.provincePillActive]}
                      onPress={() => setForm((f) => ({ ...f, provinceCode: p }))}
                    >
                      <Text style={[styles.provincePillText, form.provinceCode === p && styles.provincePillTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {renderField('Postal code', 'postalCode', 'A1A 1A1', { required: true, autoCapitalize: 'characters' })}
              {renderField('Phone', 'phone', '+1 416 555 0123', { keyboardType: 'phone-pad' })}
              {renderField('Email', 'email', 'email@example.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}

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

              <View style={{ height: spacing.xl }} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitBtn, (busy || !form.name || !form.address1 || !form.city || !form.postalCode) && styles.submitBtnDisabled]}
                onPress={save}
                disabled={busy || !form.name || !form.address1 || !form.city || !form.postalCode}
                activeOpacity={0.8}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name={editId ? 'create-outline' : 'add'} size={20} color={colors.white} />
                    <Text style={styles.submitBtnText}>{editId ? 'Update' : 'Create'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
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
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },

  searchContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: borderRadius.full, height: 50,
    paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.hairline,
  },
  searchRowFocused: {
    borderColor: colors.accent,
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, height: 50 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: borderRadius.md, backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: spacing.xs },
  emptySub: { fontSize: 14, color: colors.faint, marginBottom: spacing.xl },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.full, height: 48,
  },
  emptyBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },

  list: { flex: 1 },
  listInner: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.hairline2,
    shadowColor: 'rgba(10,10,25,0.04)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 2,
  },
  cardTags: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  defaultBadge: {
    backgroundColor: colors.accentSoft, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 3,
  },
  defaultBadgeText: { fontSize: 11.5, fontWeight: '600', color: colors.accent },
  cardLabel: { fontSize: 12, fontWeight: '600', color: colors.faint },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, paddingRight: spacing.md },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 2 },
  cardCompany: { fontSize: 13.5, color: colors.muted, marginBottom: 2 },
  cardAddr: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  cardPhone: { fontSize: 13, color: colors.accent, marginTop: spacing.xs, fontWeight: '500' },
  cardDelete: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, maxHeight: '90%' },
  grabHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairline,
    alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  modalBody: {},
  modalBodyInner: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xl },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  fieldInput: {
    backgroundColor: colors.white, borderRadius: borderRadius.sm, height: 50,
    paddingHorizontal: spacing.lg, fontSize: 15, color: colors.ink,
    borderWidth: 1, borderColor: colors.hairline,
    shadowColor: 'rgba(10,10,25,0.02)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2, elevation: 1,
  },

  provinceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  provincePill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline,
  },
  provincePillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  provincePillText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  provincePillTextActive: { color: colors.white },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: borderRadius.sm, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.hairline, height: 54,
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: colors.ink },
  toggle: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: colors.surface,
    padding: 2, justifyContent: 'center', borderWidth: 1, borderColor: colors.hairline,
  },
  toggleOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  toggleDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  toggleDotOn: { alignSelf: 'flex-end' },

  modalFooter: { padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.hairline },
  submitBtn: {
    height: 52, borderRadius: borderRadius.sm, backgroundColor: colors.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
