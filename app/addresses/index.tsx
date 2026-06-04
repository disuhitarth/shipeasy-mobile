import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo, useRef } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/lib/queries';
import type { Address } from '@/types';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { validateEmail, validateName, validatePhone, validatePostalCode, validateCity, validateRequired, validateForm, type ValidationResult } from '@/lib/validation';
import { toast } from '@/lib/toast';
import { FormField } from '@/components/ui/FormField';
import { StaggeredItem } from '@/components/Staggered';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { Sheet } from '@/components/Sheet';
import { PressableCard, PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

type FormShape = {
  label: string;
  name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  provinceCode: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  email: string;
  isResidential: boolean;
  isDefault: boolean;
};

const EMPTY_FORM: FormShape = {
  label: '', name: '', company: '', address1: '', address2: '',
  city: '', provinceCode: 'ON', postalCode: '', countryCode: 'CA',
  phone: '', email: '', isResidential: false, isDefault: false,
};

export default function AddressesScreen() {
  const { data: addresses, isLoading, refetch } = useAddresses();
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.medium();
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const createAddr = useCreateAddress();
  const updateAddr = useUpdateAddress();
  const deleteAddr = useDeleteAddress();

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormShape>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const nameRef = useRef<RNTextInput>(null);
  const companyRef = useRef<RNTextInput>(null);
  const address1Ref = useRef<RNTextInput>(null);
  const address2Ref = useRef<RNTextInput>(null);
  const cityRef = useRef<RNTextInput>(null);
  const postalRef = useRef<RNTextInput>(null);
  const phoneRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const labelRef = useRef<RNTextInput>(null);

  const validate = useCallback((): ValidationResult => {
    const r = validateForm(form, {
      name: validateName,
      address1: (v) => validateRequired(String(v ?? ''), 'Address line 1'),
      city: validateCity,
      postalCode: (v) => validatePostalCode(String(v ?? ''), form.countryCode),
      phone: (v) => validatePhone(String(v ?? '')),
      email: (v) => {
        const s = String(v ?? '').trim();
        if (!s) return null;
        return validateEmail(s);
      },
    });
    setErrors(r.errors);
    return r;
  }, [form]);

  const filtered = useMemo(() => {
    if (!addresses) return [];
    const q = search.toLowerCase();
    return addresses.filter(
      (a) => a.name.toLowerCase().includes(q) || a.address1.toLowerCase().includes(q) || a.city.toLowerCase().includes(q),
    );
  }, [addresses, search]);

  const openCreate = useCallback(() => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
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
    setErrors({});
    setTouched({});
    setModal(true);
  }, []);

  const onFieldChange = useCallback((key: keyof FormShape, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (touched[key]) {
        setTimeout(() => {
          setErrors(() => {
            const r = validateForm(next, {
              name: validateName,
              address1: (v) => validateRequired(String(v ?? ''), 'Address line 1'),
              city: validateCity,
              postalCode: (v) => validatePostalCode(String(v ?? ''), next.countryCode),
              phone: (v) => validatePhone(String(v ?? '')),
              email: (v) => {
                const s = String(v ?? '').trim();
                if (!s) return null;
                return validateEmail(s);
              },
            });
            return r.errors;
          });
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
      name: true, address1: true, city: true, postalCode: true, phone: true, email: true,
    });
    const r = validate();
    if (!r.isValid) {
      const order: (keyof FormShape)[] = ['name', 'address1', 'city', 'postalCode', 'phone', 'email'];
      const first = order.find((k) => r.errors[k]);
      const refMap: Partial<Record<keyof FormShape, React.RefObject<RNTextInput | null>>> = {
        name: nameRef,
        address1: address1Ref,
        city: cityRef,
        postalCode: postalRef,
        phone: phoneRef,
        email: emailRef,
      };
      if (first) refMap[first]?.current?.focus();
      toast.error('Please fix the highlighted fields');
      return;
    }
    const payload = { ...form };
    try {
      if (editId) {
        await updateAddr.mutateAsync({ id: editId, data: payload });
        Haptics.success();
        toast.success('Address updated');
      } else {
        await createAddr.mutateAsync(payload);
        Haptics.success();
        toast.success('Address saved');
      }
      setModal(false);
    } catch (e: any) {
      Haptics.error();
      toast.error(e?.message || 'Could not save address');
    }
  }, [form, editId, createAddr, updateAddr, validate]);

  const doDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete address', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteAddr.mutate(id); toast.success('Address deleted'); } },
    ]);
  }, [deleteAddr]);

  const busy = createAddr.isPending || updateAddr.isPending;

  const renderField = (key: keyof FormShape, opts: {
    required?: boolean; placeholder?: string; keyboardType?: any; autoCapitalize?: any;
    inputRef?: React.RefObject<RNTextInput | null>; returnKeyType?: any; onSubmit?: () => void;
    autoComplete?: string; textContentType?: string; label: string; leftIcon?: any;
  }) => (
    <FormField
      ref={opts.inputRef}
      label={opts.label}
      value={String(form[key] ?? '')}
      onChangeText={(t) => onFieldChange(key, t)}
      onBlur={() => onFieldBlur(key)}
      placeholder={opts.placeholder}
      error={touched[key] ? errors[key] : null}
      required={opts.required}
      keyboardType={opts.keyboardType}
      autoCapitalize={opts.autoCapitalize}
      autoComplete={opts.autoComplete as any}
      textContentType={opts.textContentType as any}
      returnKeyType={opts.returnKeyType}
      onSubmitEditing={opts.onSubmit}
      leftIcon={opts.leftIcon}
    />
  );

  return (
    <AnimatedScreen direction="fade-up">
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(380)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <PressableScale style={styles.headerBtn} onPress={() => router.back()} haptic="light">
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </PressableScale>
          <Text style={styles.headerTitle}>Address Book</Text>
          <PressableScale style={styles.headerBtn} onPress={openCreate} haptic="light">
            <Ionicons name="add" size={22} color={colors.ink} />
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(380).delay(40)} style={styles.searchContainer}>
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
        </Animated.View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(420)} style={styles.center}>
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
              <PressableScale style={styles.emptyBtn} onPress={openCreate} haptic="light">
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.emptyBtnText}>Add Address</Text>
              </PressableScale>
            )}
          </Animated.View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listInner}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((addr, i) => (
              <Animated.View
                key={addr._id}
                entering={FadeInDown.duration(360).delay(Math.min(i, 10) * 60)}
              >
                <PressableCard
                  style={styles.card}
                  onPress={() => openEdit(addr)}
                  haptic="light"
                >
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
                    <TouchableOpacity
                      style={styles.cardDelete}
                      onPress={() => doDelete(addr._id, addr.label || addr.name)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                </PressableCard>
              </Animated.View>
            ))}
          </ScrollView>
        )}

        <Sheet visible={modal} onClose={() => setModal(false)}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Address' : 'New Address'}</Text>
            <PressableScale onPress={() => setModal(false)} style={styles.modalClose} haptic="light">
              <Ionicons name="close" size={22} color={colors.ink} />
            </PressableScale>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyInner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {renderField('label', {
                label: 'Label', placeholder: 'e.g. Office, Home',
                inputRef: labelRef, returnKeyType: 'next',
                onSubmit: () => nameRef.current?.focus(),
                leftIcon: 'bookmark-outline',
              })}
              {renderField('name', {
                label: 'Name', placeholder: 'Recipient name', required: true,
                inputRef: nameRef, returnKeyType: 'next',
                onSubmit: () => companyRef.current?.focus(),
                autoComplete: 'name', textContentType: 'name', autoCapitalize: 'words',
                leftIcon: 'person-outline',
              })}
              {renderField('company', {
                label: 'Company', placeholder: 'Optional',
                inputRef: companyRef, returnKeyType: 'next',
                onSubmit: () => address1Ref.current?.focus(),
                autoComplete: 'organization', textContentType: 'organizationName',
                leftIcon: 'business-outline',
              })}
              {renderField('address1', {
                label: 'Address line 1', placeholder: '123 Main St', required: true,
                inputRef: address1Ref, returnKeyType: 'next',
                onSubmit: () => address2Ref.current?.focus(),
                autoComplete: 'address-line1', textContentType: 'streetAddressLine1',
                leftIcon: 'location-outline',
              })}
              {renderField('address2', {
                label: 'Address line 2', placeholder: 'Unit 4',
                inputRef: address2Ref, returnKeyType: 'next',
                onSubmit: () => cityRef.current?.focus(),
                autoComplete: 'address-line2', textContentType: 'streetAddressLine2',
                leftIcon: 'location-outline',
              })}
              {renderField('city', {
                label: 'City', placeholder: 'Toronto', required: true,
                inputRef: cityRef, returnKeyType: 'next',
                onSubmit: () => postalRef.current?.focus(),
                autoComplete: 'postal-address-locality', textContentType: 'addressCity',
                leftIcon: 'business-outline',
              })}
              <View>
                <Text style={styles.fieldLabel}>Province</Text>
                <View style={styles.provinceRow}>
                  {PROVINCES.map((p) => (
                    <PressableScale
                      key={p}
                      style={[styles.provincePill, form.provinceCode === p && styles.provincePillActive]}
                      onPress={() => onFieldChange('provinceCode', p)}
                      haptic="light"
                      scaleTo={0.94}
                    >
                      <Text style={[styles.provincePillText, form.provinceCode === p && styles.provincePillTextActive]}>{p}</Text>
                    </PressableScale>
                  ))}
                </View>
              </View>
              {renderField('postalCode', {
                label: 'Postal code', placeholder: 'A1A 1A1', required: true,
                inputRef: postalRef, returnKeyType: 'next',
                onSubmit: () => phoneRef.current?.focus(),
                autoCapitalize: 'characters', autoComplete: 'postal-code', textContentType: 'postalCode',
                leftIcon: 'mail-outline',
              })}
              {renderField('phone', {
                label: 'Phone', placeholder: '(416) 555-0123',
                inputRef: phoneRef, returnKeyType: 'next',
                onSubmit: () => emailRef.current?.focus(),
                keyboardType: 'phone-pad', autoComplete: 'tel', textContentType: 'telephoneNumber',
                leftIcon: 'call-outline',
              })}
              {renderField('email', {
                label: 'Email', placeholder: 'email@example.com',
                inputRef: emailRef, returnKeyType: 'done',
                onSubmit: save,
                keyboardType: 'email-address', autoCapitalize: 'none',
                autoComplete: 'email', textContentType: 'emailAddress',
                leftIcon: 'mail-outline',
              })}

              <PressableScale
                style={styles.toggleRow}
                onPress={() => {
                  Haptics.light();
                  setForm((f) => ({ ...f, isResidential: !f.isResidential }));
                }}
                haptic="light"
              >
                <Text style={styles.toggleLabel}>Residential address</Text>
                <View style={[styles.toggle, form.isResidential && styles.toggleOn]}>
                  <Animated.View
                    style={[styles.toggleDot, form.isResidential && styles.toggleDotOn]}
                  />
                </View>
              </PressableScale>
              <PressableScale
                style={styles.toggleRow}
                onPress={() => {
                  Haptics.light();
                  setForm((f) => ({ ...f, isDefault: !f.isDefault }));
                }}
                haptic="light"
              >
                <Text style={styles.toggleLabel}>Set as default</Text>
                <View style={[styles.toggle, form.isDefault && styles.toggleOn]}>
                  <Animated.View
                    style={[styles.toggleDot, form.isDefault && styles.toggleDotOn]}
                  />
                </View>
              </PressableScale>

              <View style={{ height: spacing.xl }} />
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={styles.modalFooter}>
            <PressableScale
              style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
              onPress={save}
              disabled={busy}
              haptic="success"
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name={editId ? 'create-outline' : 'add'} size={20} color={colors.white} />
                  <Text style={styles.submitBtnText}>{editId ? 'Update' : 'Create'}</Text>
                </>
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
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },

  searchContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.full, height: 50,
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
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg,
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
    backgroundColor: colors.surface, borderRadius: borderRadius.sm, height: 50,
    paddingHorizontal: spacing.lg, fontSize: 15, color: colors.ink,
    borderWidth: 1, borderColor: colors.hairline,
    shadowColor: 'rgba(10,10,25,0.02)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2, elevation: 1,
  },

  provinceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  provincePill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
  },
  provincePillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  provincePillText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  provincePillTextActive: { color: colors.white },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.hairline, height: 54,
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: colors.ink },
  toggle: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: colors.surface2,
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
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
