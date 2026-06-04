import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo, useRef } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSKUs, useCreateSKU, useUpdateSKU, useDeleteSKU } from '@/lib/queries';
import { track } from '@/lib/analytics';
import type { SKU } from '@/types';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { validateRequired, validateHSCode, validateAmount, validateForm, type ValidationResult } from '@/lib/validation';
import { toast } from '@/lib/toast';
import { useDebounce } from '@/lib/useDebounce';
import { FormField } from '@/components/ui/FormField';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { Sheet } from '@/components/Sheet';
import { PressableCard, PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';

type FormShape = {
  sku: string;
  name: string;
  description: string;
  hsCode: string;
  countryOfOrigin: string;
  defaultValue: string;
  defaultQuantity: string;
  requiresSignature: boolean;
  requiresInsurance: boolean;
};

const EMPTY_FORM: FormShape = {
  sku: '', name: '', description: '', hsCode: '', countryOfOrigin: '',
  defaultValue: '', defaultQuantity: '1',
  requiresSignature: false, requiresInsurance: false,
};

export default function SKUsScreen() {
  const { data: skus, isLoading, refetch } = useSKUs();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.selection();
    await refetch();
    setRefreshing(false);
    toast.success('Updated!');
  }, [refetch]);

  const createSku = useCreateSKU();
  const updateSku = useUpdateSKU();
  const deleteSku = useDeleteSKU();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const isDebouncing = search !== debouncedSearch;
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormShape>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const skuRef = useRef<RNTextInput>(null);
  const nameRef = useRef<RNTextInput>(null);
  const descRef = useRef<RNTextInput>(null);
  const hsRef = useRef<RNTextInput>(null);
  const countryRef = useRef<RNTextInput>(null);
  const valueRef = useRef<RNTextInput>(null);
  const qtyRef = useRef<RNTextInput>(null);

  const validate = useCallback((): ValidationResult => {
    const r = validateForm(form, {
      sku: (v) => validateRequired(String(v ?? '').trim(), 'SKU code'),
      name: (v) => validateRequired(String(v ?? '').trim(), 'Name'),
      hsCode: (v) => validateHSCode(String(v ?? '')),
      defaultValue: (v) => {
        const s = String(v ?? '').trim();
        if (!s) return null;
        const n = parseFloat(s);
        if (Number.isNaN(n)) return 'Enter a valid value';
        return validateAmount(n, 0, 100000);
      },
      defaultQuantity: (v) => {
        const s = String(v ?? '').trim();
        if (!s) return 'Quantity is required';
        const n = parseInt(s, 10);
        if (Number.isNaN(n)) return 'Enter a whole number';
        if (n < 1) return 'Min 1';
        if (n > 9999) return 'Max 9999';
        return null;
      },
    });
    setErrors(r.errors);
    return r;
  }, [form]);

  const filtered = useMemo(() => {
    if (!skus) return [];
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return skus;
    return skus.filter(
      (s) => s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q),
    );
  }, [skus, debouncedSearch]);

  const clearSearch = useCallback(() => {
    Haptics.light();
    setSearch('');
  }, []);

  const openCreate = useCallback(() => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
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
    setErrors({});
    setTouched({});
    setModal(true);
  }, []);

  const onFieldChange = useCallback((key: keyof FormShape, value: string) => {
    const final = key === 'sku' ? value.toUpperCase() : value;
    setForm((f) => {
      const next = { ...f, [key]: final };
      if (touched[key]) {
        setTimeout(() => {
          const r = validateForm(next, {
            sku: (v) => validateRequired(String(v ?? '').trim(), 'SKU code'),
            name: (v) => validateRequired(String(v ?? '').trim(), 'Name'),
            hsCode: (v) => validateHSCode(String(v ?? '')),
            defaultValue: (v) => {
              const s = String(v ?? '').trim();
              if (!s) return null;
              const n = parseFloat(s);
              if (Number.isNaN(n)) return 'Enter a valid value';
              return validateAmount(n, 0, 100000);
            },
            defaultQuantity: (v) => {
              const s = String(v ?? '').trim();
              if (!s) return 'Quantity is required';
              const n = parseInt(s, 10);
              if (Number.isNaN(n)) return 'Enter a whole number';
              if (n < 1) return 'Min 1';
              if (n > 9999) return 'Max 9999';
              return null;
            },
          });
          setErrors(r.errors);
        }, 0);
      }
      return next;
    });
  }, [touched]);

  const onFieldBlur = useCallback((key: keyof FormShape) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setTimeout(() => validate(), 0);
  }, [validate]);

  const save = useCallback(async () => {
    setTouched({
      sku: true, name: true, hsCode: true,
      defaultValue: true, defaultQuantity: true,
    });
    const r = validate();
    if (!r.isValid) {
      const order: (keyof FormShape)[] = ['sku', 'name', 'hsCode', 'defaultValue', 'defaultQuantity'];
      const first = order.find((k) => r.errors[k]);
      const refMap: Partial<Record<keyof FormShape, React.RefObject<RNTextInput | null>>> = {
        sku: skuRef, name: nameRef, hsCode: hsRef,
        defaultValue: valueRef, defaultQuantity: qtyRef,
      };
      if (first) refMap[first]?.current?.focus();
      toast.error('Please fix the highlighted fields');
      return;
    }
    const payload = {
      sku: form.sku.toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      hsCode: form.hsCode.trim(),
      countryOfOrigin: form.countryOfOrigin.trim(),
      defaultValue: parseFloat(form.defaultValue) || undefined,
      defaultQuantity: parseInt(form.defaultQuantity, 10) || 1,
      requiresSignature: form.requiresSignature,
      requiresInsurance: form.requiresInsurance,
    };
    try {
      if (editId) {
        await updateSku.mutateAsync({ id: editId, data: payload });
        Haptics.success();
        toast.success('SKU updated');
      } else {
        await createSku.mutateAsync(payload);
        Haptics.success();
        void track('sku_added', { hsCode: payload.hsCode });
        toast.success('SKU created');
      }
      setModal(false);
    } catch (e: any) {
      Haptics.error();
      toast.error(e?.message || 'Could not save SKU');
    }
  }, [form, editId, createSku, updateSku, validate]);

  const doDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete SKU', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteSku.mutate(id); toast.success('SKU deleted'); } },
    ]);
  }, [deleteSku]);

  const busy = createSku.isPending || updateSku.isPending || deleteSku.isPending;

  return (
    <AnimatedScreen direction="fade-up">
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(380)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <PressableScale style={styles.headerBtn} onPress={() => router.back()} haptic="light">
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </PressableScale>
          <Text style={styles.headerTitle}>SKU Manager</Text>
          <PressableScale style={styles.headerBtn} onPress={openCreate} haptic="light">
            <Ionicons name="add" size={22} color={colors.ink} />
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(380).delay(40)}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.faint} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search SKUs or products…"
              placeholderTextColor={colors.faint}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {isDebouncing ? (
              <ActivityIndicator size="small" color={colors.faint} />
            ) : search.length > 0 ? (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={colors.faint} />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(420)} style={styles.center}>
            <Ionicons
              name={debouncedSearch ? 'search-outline' : 'pricetags-outline'}
              size={64}
              color={colors.accentSoft}
            />
            <Text style={styles.emptyText}>
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No SKUs yet'}
            </Text>
            <Text style={styles.emptySub}>
              {debouncedSearch ? 'Try a different search' : 'Create your first product preset'}
            </Text>
            {debouncedSearch ? (
              <PressableScale style={styles.emptyBtn} onPress={clearSearch} haptic="light">
                <Ionicons name="close-circle" size={16} color={colors.white} />
                <Text style={styles.emptyBtnText}>Clear search</Text>
              </PressableScale>
            ) : (
              <PressableScale style={styles.emptyBtn} onPress={openCreate} haptic="light">
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.emptyBtnText}>Create SKU</Text>
              </PressableScale>
            )}
          </Animated.View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listInner}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((s, i) => (
              <Animated.View
                key={s._id}
                entering={FadeInDown.duration(360).delay(Math.min(i, 10) * 60)}
              >
                <PressableCard style={styles.card} onPress={() => openEdit(s)} haptic="light">
                  <View style={styles.cardTop}>
                    <View style={styles.skuBadge}>
                      <Text style={styles.skuBadgeText}>{s.sku}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => doDelete(s._id, s.name)}
                      hitSlop={8}
                    >
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
                </PressableCard>
              </Animated.View>
            ))}
          </ScrollView>
        )}

        <Sheet visible={modal} onClose={() => setModal(false)}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editId ? 'Edit SKU' : 'New SKU'}</Text>
            <PressableScale onPress={() => setModal(false)} hitSlop={8} haptic="light">
              <Ionicons name="close" size={24} color={colors.ink} />
            </PressableScale>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyInner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FormField
                ref={skuRef}
                label="SKU code"
                value={form.sku}
                onChangeText={(t) => onFieldChange('sku', t)}
                onBlur={() => onFieldBlur('sku')}
                placeholder="e.g. TSHIRT-BLK-M"
                error={touched.sku ? errors.sku : null}
                required
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!editId}
                returnKeyType="next"
                onSubmitEditing={() => nameRef.current?.focus()}
              />
              <FormField
                ref={nameRef}
                label="Name"
                value={form.name}
                onChangeText={(t) => onFieldChange('name', t)}
                onBlur={() => onFieldBlur('name')}
                placeholder="Product name"
                error={touched.name ? errors.name : null}
                required
                autoCapitalize="sentences"
                returnKeyType="next"
                onSubmitEditing={() => descRef.current?.focus()}
              />
              <FormField
                ref={descRef}
                label="Description"
                value={form.description}
                onChangeText={(t) => onFieldChange('description', t)}
                onBlur={() => onFieldBlur('description')}
                placeholder="Optional description"
                multiline
              />
              <FormField
                ref={hsRef}
                label="HS code"
                value={form.hsCode}
                onChangeText={(t) => onFieldChange('hsCode', t)}
                onBlur={() => onFieldBlur('hsCode')}
                placeholder="e.g. 6109.10.00"
                error={touched.hsCode ? errors.hsCode : null}
                hint={!touched.hsCode || !errors.hsCode ? '6–10 digits, dots optional' : undefined}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => countryRef.current?.focus()}
              />
              <FormField
                ref={countryRef}
                label="Country of origin"
                value={form.countryOfOrigin}
                onChangeText={(t) => onFieldChange('countryOfOrigin', t)}
                onBlur={() => onFieldBlur('countryOfOrigin')}
                placeholder="e.g. Canada"
                autoComplete="country"
                textContentType="countryName"
                returnKeyType="next"
                onSubmitEditing={() => valueRef.current?.focus()}
              />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FormField
                    ref={valueRef}
                    label="Default value"
                    value={form.defaultValue}
                    onChangeText={(t) => onFieldChange('defaultValue', t)}
                    onBlur={() => onFieldBlur('defaultValue')}
                    placeholder="0.00"
                    error={touched.defaultValue ? errors.defaultValue : null}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => qtyRef.current?.focus()}
                  />
                </View>
                <View style={styles.halfField}>
                  <FormField
                    ref={qtyRef}
                    label="Default quantity"
                    value={form.defaultQuantity}
                    onChangeText={(t) => onFieldChange('defaultQuantity', t)}
                    onBlur={() => onFieldBlur('defaultQuantity')}
                    placeholder="1"
                    error={touched.defaultQuantity ? errors.defaultQuantity : null}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onSubmitEditing={save}
                  />
                </View>
              </View>

              <View style={styles.toggleGroup}>
                <PressableScale
                  style={styles.toggleRow}
                  onPress={() => {
                    Haptics.light();
                    setForm((f) => ({ ...f, requiresSignature: !f.requiresSignature }));
                  }}
                  haptic="light"
                >
                  <View style={styles.toggleLabelGroup}>
                    <Ionicons name="create-outline" size={18} color={colors.muted} />
                    <Text style={styles.toggleLabel}>Requires signature</Text>
                  </View>
                  <View style={[styles.toggle, form.requiresSignature && styles.toggleOn]}>
                    <Animated.View
                      style={[styles.toggleDot, form.requiresSignature && styles.toggleDotOn]}
                    />
                  </View>
                </PressableScale>
                <PressableScale
                  style={styles.toggleRow}
                  onPress={() => {
                    Haptics.light();
                    setForm((f) => ({ ...f, requiresInsurance: !f.requiresInsurance }));
                  }}
                  haptic="light"
                >
                  <View style={styles.toggleLabelGroup}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.muted} />
                    <Text style={styles.toggleLabel}>Requires insurance</Text>
                  </View>
                  <View style={[styles.toggle, form.requiresInsurance && styles.toggleOn]}>
                    <Animated.View
                      style={[styles.toggleDot, form.requiresInsurance && styles.toggleDotOn]}
                    />
                  </View>
                </PressableScale>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={styles.modalFooter}>
            <PressableScale
              style={[styles.modalBtn, busy && styles.modalBtnDisabled]}
              onPress={save}
              disabled={busy}
              haptic="success"
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.modalBtnText}>{editId ? 'Update SKU' : 'Create SKU'}</Text>
              )}
            </PressableScale>
          </View>
        </Sheet>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
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

  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  modalBody: {},
  modalBodyInner: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: 40 },
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
  modalBtnDisabled: { opacity: 0.6 },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
