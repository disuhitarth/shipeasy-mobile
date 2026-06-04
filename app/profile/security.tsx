import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, TextInput, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useAuth } from '@/store/auth';
import { useBiometric } from '@/store/biometric';
import { toast } from '@/lib/toast';
import { light, medium, success, error } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Cell, Group } from '@/components/ui/Cell';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';

export default function SecurityScreen() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const biometricEnabled = useBiometric((s) => s.enabled);
  const setBiometric = useBiometric((s) => s.setEnabled);

  const [togglingBio, setTogglingBio] = useState(false);
  const [bioType, setBioType] = useState<'Face ID' | 'Touch ID' | 'Fingerprint'>('Fingerprint');
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBioType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBioType('Fingerprint');
        } else {
          setBioType('Touch ID');
        }
      } catch {}
    })();
  }, []);

  const toggleBiometric = useCallback(async () => {
    if (biometricEnabled) {
      Alert.alert(
        `Disable ${bioType}?`,
        'You will need to use your password to access the wallet.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable', style: 'destructive', onPress: async () => {
              await setBiometric(false);
              light();
              toast.success(`${bioType} disabled`);
            },
          },
        ],
      );
      return;
    }
    setTogglingBio(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        toast.error('Biometric hardware not available');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          'No biometrics enrolled',
          `Set up ${bioType} in your device settings, then return to enable this lock.`,
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${bioType}`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        await setBiometric(true);
        success();
        toast.success(`${bioType} enabled`);
      }
    } finally {
      setTogglingBio(false);
    }
  }, [biometricEnabled, setBiometric, bioType]);

  const changePassword = useCallback(async () => {
    if (!currentPwd || !newPwd) {
      toast.error('Fill in all password fields');
      return;
    }
    if (newPwd.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPwd === currentPwd) {
      toast.error('New password must differ from current');
      return;
    }
    setPwdSaving(true);
    try {
      const { default: api } = await import('@/lib/api');
      await api.post('/auth/change-password', {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      success();
      toast.success('Password updated');
      setPwdOpen(false);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) {
      error();
      toast.error(e?.message ?? 'Could not change password');
    } finally {
      setPwdSaving(false);
    }
  }, [currentPwd, newPwd, confirmPwd]);

  const signOutAll = () => {
    medium();
    Alert.alert(
      'Sign out of all devices?',
      'This will end every active session for your account. You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out everywhere', style: 'destructive', onPress: async () => {
            setSigningOut(true);
            try {
              const { default: api } = await import('@/lib/api');
              try { await api.post('/auth/sign-out-all'); } catch {}
              await logout();
              success();
              toast.success('Signed out of all devices');
              router.replace('/auth/login');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Security" showBack />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={28} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Account security</Text>
          <Text style={styles.heroSub}>Manage how you sign in and protect your wallet</Text>
        </View>

        <Text style={styles.section}>Authentication</Text>
        <Group>
          <View style={styles.cellRow}>
            <View style={styles.cellIcon}>
              <Ionicons name="finger-print" size={20} color={colors.ink} />
            </View>
            <View style={styles.cellInfo}>
              <Text style={styles.cellLabel}>{bioType} lock</Text>
              <Text style={styles.cellSub}>
                {biometricEnabled ? 'Required to view wallet' : 'Off — wallet opens instantly'}
              </Text>
            </View>
            {togglingBio ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
                thumbColor={biometricEnabled ? colors.accent : '#fff'}
              />
            )}
          </View>
          <Cell
            icon="lock-closed-outline"
            label="Change password"
            chevron
            onPress={() => { light(); setPwdOpen(true); }}
          >
            <View />
          </Cell>
        </Group>

        <Text style={styles.section}>Sessions</Text>
        <Group>
          <View style={styles.cellRow}>
            <View style={styles.cellIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.ink} />
            </View>
            <View style={styles.cellInfo}>
              <Text style={styles.cellLabel}>This device</Text>
              <Text style={styles.cellSub}>
                {user?.email ?? '—'} · Active now
              </Text>
            </View>
            <View style={styles.activeDot} />
          </View>
          <Cell
            icon="log-out-outline"
            label="Sign out of all devices"
            onPress={signingOut ? undefined : signOutAll}
          >
            <View />
          </Cell>
        </Group>

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.faint} />
          <Text style={styles.footerText}>
            We never store your password in plain text. All changes are protected with end-to-end encryption.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={pwdOpen} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => !pwdSaving && setPwdOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.grabHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change password</Text>
              <TouchableOpacity onPress={() => setPwdOpen(false)} style={styles.modalClose} disabled={pwdSaving}>
                <Ionicons name="close" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyInner}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>Current password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={17} color={colors.faint} />
                  <TextInput
                    style={styles.input}
                    value={currentPwd}
                    onChangeText={setCurrentPwd}
                    secureTextEntry
                    placeholder="Enter current password"
                    placeholderTextColor={colors.faint}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>New password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="key-outline" size={17} color={colors.faint} />
                  <TextInput
                    style={styles.input}
                    value={newPwd}
                    onChangeText={setNewPwd}
                    secureTextEntry
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.faint}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.fieldLabel}>Confirm new password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="checkmark-circle-outline" size={17} color={colors.faint} />
                  <TextInput
                    style={styles.input}
                    value={confirmPwd}
                    onChangeText={setConfirmPwd}
                    secureTextEntry
                    placeholder="Re-enter new password"
                    placeholderTextColor={colors.faint}
                    autoCapitalize="none"
                  />
                </View>
                {confirmPwd.length > 0 && newPwd !== confirmPwd && (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                )}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitBtn, (pwdSaving || !currentPwd || !newPwd || !confirmPwd) && styles.submitBtnDisabled]}
                onPress={changePassword}
                disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
                activeOpacity={0.8}
              >
                {pwdSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Update password</Text>
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
  body: { flex: 1 },
  bodyInner: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  heroTitle: { ...typography.title3, marginBottom: 4 },
  heroSub: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  section: { ...typography.eyebrow, marginTop: spacing.md, paddingHorizontal: 4 },
  cellRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 15, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  cellIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  cellInfo: { flex: 1 },
  cellLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  cellSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  footer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: spacing.md, marginTop: spacing.md,
  },
  footerText: { flex: 1, fontSize: 12.5, color: colors.faint, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, maxHeight: '90%' },
  grabHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.xs },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  modalBody: {},
  modalBodyInner: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  inputWrap: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg, height: 50,
    borderWidth: 1, borderColor: colors.hairline,
  },
  input: { flex: 1, fontSize: 15, color: colors.ink, height: 50 },
  errorText: { fontSize: 12, color: colors.red, marginTop: 4 },
  modalFooter: { padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.hairline },
  submitBtn: { height: 52, borderRadius: borderRadius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 4 },
  submitBtnDisabled: { opacity: 0.42 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
