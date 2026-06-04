import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, TextInput, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/store/auth';
import { useBiometric } from '@/store/biometric';
import { toast } from '@/lib/toast';
import { light, medium, success, error, selection } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Cell, Group } from '@/components/ui/Cell';
import { PinPad } from '@/components/ui/PinPad';
import { PinSetupSheet } from '@/components/ui/PinSetupSheet';
import { PressableScale } from '@/components/PressableScale';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';
import api from '@/lib/api';
import { preventCapture, allowCapture } from '@/lib/screenCapture';

function getDeviceLabel(): string {
  const cfg = (Constants.expoConfig as any) || {};
  const name = cfg?.deviceName;
  if (name) return name;
  if (Platform.OS === 'ios') {
    return Application.nativeApplicationVersion ? 'iPhone' : 'iOS Device';
  }
  if (Platform.OS === 'android') {
    return 'Android Device';
  }
  return 'This device';
}

function timeAgo(iso: string | undefined): string {
  if (!iso) return 'Active now';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'Active now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return d.toLocaleDateString();
}

export default function SecurityScreen() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const biometricEnabled = useBiometric((s) => s.enabled);
  const setBiometric = useBiometric((s) => s.setEnabled);
  const hasPin = useBiometric((s) => s.hasPin);
  const setPin = useBiometric((s) => s.setPin);
  const clearPin = useBiometric((s) => s.clearPin);
  const lockNow = useBiometric((s) => s.lockNow);
  const verifyPin = useBiometric((s) => s.verifyPin);

  const [togglingBio, setTogglingBio] = useState(false);
  const [bioType, setBioType] = useState<'Face ID' | 'Touch ID' | 'Fingerprint'>('Fingerprint');
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [pinUnlockOpen, setPinUnlockOpen] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [pinPending, setPinPending] = useState(false);
  const [pinCooldown, setPinCooldown] = useState(0);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [authingPin, setAuthingPin] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      preventCapture('security');
      return () => {
        allowCapture('security');
      };
    }, []),
  );

  useEffect(() => {
    if (pinCooldown <= 0) return;
    const id = setInterval(() => {
      setPinCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [pinCooldown]);

  const toggleBiometric = useCallback(async () => {
    if (biometricEnabled) {
      Alert.alert(
        `Disable ${bioType}?`,
        'You will need to use your password or PIN to access the wallet.',
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
    if (!/[A-Za-z]/.test(newPwd) || !/\d/.test(newPwd)) {
      toast.error('Password must include a letter and a number');
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

  const onPinSetupComplete = useCallback(
    async (pin: string) => {
      try {
        await setPin(pin);
        success();
        toast.success('PIN set · you can use it to unlock the wallet');
        setPinSetupOpen(false);
      } catch (e: any) {
        error();
        toast.error('Could not save PIN');
      }
    },
    [setPin],
  );

  const onRemovePin = useCallback(() => {
    Alert.alert('Remove PIN?', 'You will no longer be able to unlock with a PIN.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await clearPin();
            toast.success('PIN removed');
          } catch {
            toast.error('Could not remove PIN');
          }
        },
      },
    ]);
  }, [clearPin]);

  const onPinEnteredForUnlock = useCallback(
    async (pin: string) => {
      if (authingPin || pinPending || pinCooldown > 0) return;
      setPinPending(true);
      setAuthingPin(true);
      try {
        const ok = await verifyPin(pin);
        if (ok) {
          success();
          toast.success('PIN verified');
          setPinUnlockOpen(false);
          setPinError(false);
          setPinAttempts(0);
        } else {
          setPinError(true);
          const next = pinAttempts + 1;
          setPinAttempts(next);
          if (next >= 5) {
            setPinCooldown(30);
            toast.error('Too many attempts, try again in 30s');
          } else {
            toast.error(`Incorrect PIN · ${5 - next} attempt${5 - next === 1 ? '' : 's'} left`);
          }
          error();
        }
      } finally {
        setAuthingPin(false);
        setPinPending(false);
      }
    },
    [authingPin, pinPending, pinCooldown, verifyPin, pinAttempts],
  );

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

  const lockAppNow = () => {
    lockNow();
    success();
    toast.success('App locked');
  };

  const deviceLabel = getDeviceLabel();
  const lastActive = user?.createdAt ? new Date(user.createdAt).toISOString() : undefined;

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
          <TouchableOpacity
            style={styles.cellRow}
            activeOpacity={0.6}
            onPress={hasPin ? onRemovePin : () => setPinSetupOpen(true)}
          >
            <View style={styles.cellIcon}>
              <Ionicons name="keypad-outline" size={20} color={colors.ink} />
            </View>
            <View style={styles.cellInfo}>
              <Text style={styles.cellLabel}>{hasPin ? 'Change PIN' : 'Set 4-digit PIN'}</Text>
              <Text style={styles.cellSub}>
                {hasPin ? 'PIN set · tap to remove' : 'Backup for when biometrics fail'}
              </Text>
            </View>
            <Ionicons name={hasPin ? 'trash-outline' : 'chevron-forward'} size={18} color={colors.faint} />
          </TouchableOpacity>
          {hasPin && (
            <View style={styles.cellRow}>
              <View style={styles.cellIcon}>
                <Ionicons name="lock-open-outline" size={20} color={colors.ink} />
              </View>
              <View style={styles.cellInfo}>
                <Text style={styles.cellLabel}>Test PIN</Text>
                <Text style={styles.cellSub}>Verify the PIN works</Text>
              </View>
              <PressableScale
                onPress={() => {
                  setPinError(false);
                  setPinAttempts(0);
                  setPinUnlockOpen(true);
                }}
                haptic="light"
                style={styles.linkBtn}
              >
                <Text style={styles.linkBtnText}>Try now</Text>
              </PressableScale>
            </View>
          )}
          <Cell
            icon="lock-closed-outline"
            label="Change password"
            chevron
            onPress={() => { light(); setPwdOpen(true); }}
          >
            <View />
          </Cell>
          <TouchableOpacity
            style={[styles.cellRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.6}
            onPress={() => { selection(); setTwoFAOpen(true); }}
          >
            <View style={styles.cellIcon}>
              <Ionicons name="shield-half-outline" size={20} color={colors.ink} />
            </View>
            <View style={styles.cellInfo}>
              <Text style={styles.cellLabel}>Two-factor authentication</Text>
              <Text style={styles.cellSub}>{twoFAEnabled ? 'Enabled' : 'Add an extra layer of security'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </TouchableOpacity>
        </Group>

        <Text style={styles.section}>Active devices</Text>
        <Group>
          <View style={styles.deviceRow}>
            <View style={styles.deviceIcon}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'logo-apple' : Platform.OS === 'android' ? 'logo-android' : 'desktop-outline'}
                size={20}
                color={colors.ink}
              />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceLabel}>{deviceLabel}</Text>
              <Text style={styles.deviceMeta}>
                {user?.email ?? '—'} · {timeAgo(lastActive)}
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

        <Text style={styles.section}>Quick actions</Text>
        <Group>
          <TouchableOpacity
            style={[styles.cellRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={lockAppNow}
          >
            <View style={[styles.cellIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="lock-closed" size={20} color={colors.accent} />
            </View>
            <View style={styles.cellInfo}>
              <Text style={styles.cellLabel}>Lock app</Text>
              <Text style={styles.cellSub}>Require authentication on next access</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </TouchableOpacity>
        </Group>

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.faint} />
          <Text style={styles.footerText}>
            We never store your password or PIN in plain text. All changes are protected with end-to-end encryption.
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

      <PinSetupSheet
        visible={pinSetupOpen}
        onClose={() => setPinSetupOpen(false)}
        onComplete={onPinSetupComplete}
        title="Set 4-digit PIN"
      />

      <Modal visible={pinUnlockOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setPinUnlockOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.grabHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Test your PIN</Text>
              <TouchableOpacity onPress={() => setPinUnlockOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <PinPad
              onComplete={onPinEnteredForUnlock}
              error={pinError}
              title={pinCooldown > 0 ? `Locked (${pinCooldown}s)` : 'Enter your PIN'}
              subtitle={pinCooldown > 0 ? 'Too many wrong attempts' : 'We won’t store this attempt'}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={twoFAOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setTwoFAOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.twoFASheet}>
            <View style={styles.grabHandle} />
            <View style={styles.twoFAHeader}>
              <View style={styles.twoFAIconWrap}>
                <Ionicons name="shield-half" size={32} color={colors.accent} />
              </View>
              <Text style={styles.twoFATitle}>Two-factor authentication</Text>
              <Text style={styles.twoFASub}>
                Add a second step to your sign-in with an authenticator app. We’re rolling this out soon.
              </Text>
            </View>
            <View style={styles.twoFAFeatureList}>
              <View style={styles.twoFAFeature}>
                <Ionicons name="qr-code" size={18} color={colors.ink} />
                <Text style={styles.twoFAFeatureText}>Scan a QR code with Google Authenticator or 1Password</Text>
              </View>
              <View style={styles.twoFAFeature}>
                <Ionicons name="keypad" size={18} color={colors.ink} />
                <Text style={styles.twoFAFeatureText}>Enter the 6-digit code to confirm</Text>
              </View>
              <View style={styles.twoFAFeature}>
                <Ionicons name="cloud-download" size={18} color={colors.ink} />
                <Text style={styles.twoFAFeatureText}>Backup codes in case you lose your device</Text>
              </View>
            </View>
            <PressableScale
              style={styles.twoFABtn}
              onPress={() => { setTwoFAOpen(false); toast.info('2FA will be available in a future update'); }}
              haptic="light"
            >
              <Text style={styles.twoFABtnText}>Got it</Text>
            </PressableScale>
            <Pressable onPress={() => setTwoFAOpen(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
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
  linkBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm,
    backgroundColor: colors.accentSoft,
  },
  linkBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 15, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  deviceIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  deviceInfo: { flex: 1 },
  deviceLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  deviceMeta: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  footer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: spacing.md, marginTop: spacing.md,
  },
  footerText: { flex: 1, fontSize: 12.5, color: colors.faint, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, maxHeight: '90%' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, paddingTop: spacing.sm, paddingBottom: spacing['3xl'] },
  twoFASheet: { backgroundColor: colors.bg, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, paddingTop: spacing.sm, paddingBottom: spacing['2xl'] },
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

  twoFAHeader: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  twoFAIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  twoFATitle: { fontSize: 19, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  twoFASub: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  twoFAFeatureList: { paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing.lg },
  twoFAFeature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  twoFAFeatureText: { flex: 1, fontSize: 14, color: colors.ink },
  twoFABtn: {
    marginHorizontal: spacing.xl,
    height: 52, borderRadius: borderRadius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  twoFABtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 24, marginTop: spacing.sm },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
