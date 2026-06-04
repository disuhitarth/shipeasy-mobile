import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import api from '@/lib/api';
import { useAuth } from '@/store/auth';
import { toast } from '@/lib/toast';
import { light, success, error } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';

export default function PersonalDetailsScreen() {
  const user = useAuth((s) => s.user);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const isValid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email);

  const onSave = useCallback(async () => {
    if (!isValid) {
      error();
      toast.error('Please enter a valid name and email');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/auth/me', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
      });
      const updated = res.data?.user ?? res.data;
      if (updated) {
        useAuth.setState({ user: { ...user, ...updated } });
      }
      success();
      toast.success('Profile updated');
      setEditing(false);
    } catch (e: any) {
      error();
      toast.error(e?.message ?? 'Could not save changes');
    } finally {
      setSaving(false);
    }
  }, [name, email, phone, isValid, user]);

  const discard = () => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
    }
    setEditing(false);
  };

  const confirmDiscard = () => {
    light();
    Alert.alert('Discard changes?', 'Your edits will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: discard },
    ]);
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Personal details"
        rightLabel={editing ? 'Save' : 'Edit'}
        onRightPress={() => (editing ? onSave() : (light(), setEditing(true)))}
        showBack
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="person" size={26} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Your account</Text>
          <Text style={styles.heroSub}>Keep your contact details up to date</Text>
        </View>

        <Text style={styles.section}>Profile</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={[styles.inputRow, !editing && styles.inputRowDisabled]}>
              <Ionicons name="person-outline" size={17} color={colors.faint} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                editable={editing}
                placeholder="Your name"
                placeholderTextColor={colors.faint}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.inputRow, !editing && styles.inputRowDisabled]}>
              <Ionicons name="mail-outline" size={17} color={colors.faint} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                editable={editing}
                placeholder="you@example.com"
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <View style={[styles.inputRow, !editing && styles.inputRowDisabled]}>
              <Ionicons name="call-outline" size={17} color={colors.faint} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                editable={editing}
                placeholder="+1 416 555 0123"
                placeholderTextColor={colors.faint}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={styles.fieldHint}>Used for delivery updates and account recovery</Text>
          </View>
        </View>

        <Text style={styles.section}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="mail-outline" size={18} color={colors.ink} style={styles.toggleIcon} />
              <View style={styles.toggleTextWrap}>
                <Text style={styles.toggleLabel}>Email notifications</Text>
                <Text style={styles.toggleSub}>Shipment updates, receipts, news</Text>
              </View>
            </View>
            <Switch
              value={emailNotif}
              onValueChange={(v) => { light(); setEmailNotif(v); }}
              trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
              thumbColor={emailNotif ? colors.accent : '#fff'}
            />
          </View>
          <View style={[styles.toggleRow, styles.toggleRowLast]}>
            <View style={styles.toggleInfo}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.ink} style={styles.toggleIcon} />
              <View style={styles.toggleTextWrap}>
                <Text style={styles.toggleLabel}>SMS notifications</Text>
                <Text style={styles.toggleSub}>Critical delivery alerts only</Text>
              </View>
            </View>
            <Switch
              value={smsNotif}
              onValueChange={(v) => { light(); setSmsNotif(v); }}
              trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
              thumbColor={smsNotif ? colors.accent : '#fff'}
            />
          </View>
        </View>

        <Text style={styles.section}>Account info</Text>
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Ionicons name="calendar-outline" size={16} color={colors.muted} />
            </View>
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Member since</Text>
              <Text style={styles.metaValue}>{memberSince}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.muted} />
            </View>
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Account role</Text>
              <Text style={styles.metaValue}>{user?.role === 'admin' ? 'Administrator' : 'Customer'}</Text>
            </View>
          </View>
          <View style={[styles.metaRow, styles.metaRowLast]}>
            <View style={styles.metaIcon}>
              <Ionicons name="finger-print-outline" size={16} color={colors.muted} />
            </View>
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>User ID</Text>
              <Text style={styles.metaValueMono} numberOfLines={1}>{user?._id}</Text>
            </View>
          </View>
        </View>

        {editing && (
          <TouchableOpacity style={styles.discardBtn} onPress={confirmDiscard} activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={16} color={colors.red} />
            <Text style={styles.discardText}>Discard changes</Text>
          </TouchableOpacity>
        )}

        {saving && (
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  bodyInner: { padding: spacing.lg, paddingBottom: 60, gap: spacing.lg },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  heroTitle: { ...typography.title3, marginBottom: 4 },
  heroSub: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  section: { ...typography.eyebrow, marginTop: spacing.sm, paddingHorizontal: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.sm,
  },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldHint: { fontSize: 12, color: colors.faint, marginTop: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface2, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg, height: 50,
    borderWidth: 1, borderColor: 'transparent',
  },
  inputRowDisabled: { opacity: 0.6 },
  input: { flex: 1, fontSize: 15, color: colors.ink, height: 50 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleRowLast: {},
  toggleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md, paddingRight: spacing.md },
  toggleIcon: { width: 32, height: 32, textAlign: 'center' },
  toggleTextWrap: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  toggleSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  metaRowLast: { paddingBottom: 0, borderBottomWidth: 0 },
  metaIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  metaInfo: { flex: 1 },
  metaLabel: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  metaValue: { fontSize: 15, color: colors.ink, fontWeight: '500', marginTop: 2 },
  metaValueMono: { fontSize: 12.5, color: colors.muted, marginTop: 2, fontFamily: 'ui-monospace' },
  discardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: borderRadius.sm,
    backgroundColor: colors.redSoft, marginTop: spacing.sm,
  },
  discardText: { color: colors.red, fontSize: 14, fontWeight: '600' },
  savingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)' },
});
