import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useAuth } from '@/store/auth';
import { useBiometric } from '@/store/biometric';
import { Cell, Group } from '@/components/ui/Cell';
import { StaggeredItem } from '@/components/Staggered';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { PressableScale } from '@/components/PressableScale';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';
import { useState, useCallback, useEffect } from 'react';
import { track } from '@/lib/analytics';
import { formatTimeAgo } from '@/lib/timeAgo';
import { toast } from '@/lib/toast';
import * as Haptics from '@/lib/haptics';
import Constants from 'expo-constants';

const PROFILE_PRIMARY: Array<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  external?: boolean;
}> = [
  { label: 'Personal details', icon: 'person-outline', route: '/profile/personal-details' },
  { label: 'Address book', icon: 'location-outline', route: '/addresses' },
  { label: 'Payment methods', icon: 'wallet-outline', route: '/(tabs)/wallet' },
  { label: 'Security', icon: 'shield-outline', route: '/profile/security' },
  { label: 'Notifications', icon: 'notifications-outline', route: '/profile/notifications' },
  { label: 'Appearance', icon: 'color-palette-outline', route: '/profile/appearance' },
  { label: 'Help & support', icon: 'help-circle-outline', route: '/profile/help' },
  { label: 'About', icon: 'information-circle-outline', route: '/profile/about' },
];

const PRIVACY_URL = 'https://shipeasyplus.netlify.app/privacy';
const TERMS_URL = 'https://shipeasyplus.netlify.app/terms';

export default function ProfileScreen() {
  const { isAuthenticated, user, logout } = useAuth();
  const biometricEnabled = useBiometric((s) => s.enabled);
  const setBiometric = useBiometric((s) => s.setEnabled);
  const lockNow = useBiometric((s) => s.lockNow);
  const [toggling, setToggling] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : 2024;

  const toggleBiometric = useCallback(async () => {
    if (biometricEnabled) {
      await setBiometric(false);
      Haptics.light();
      return;
    }
    setToggling(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not available', 'Biometric authentication is not available on this device');
        void track('biometric_auth_failed', { reason: 'no_hardware' });
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Not set up', 'No biometrics enrolled. Set up Face ID / fingerprint in system settings.');
        void track('biometric_auth_failed', { reason: 'not_enrolled' });
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric lock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        await setBiometric(true);
        Haptics.success();
        void track('biometric_auth_success', { source: 'profile_toggle' });
      } else {
        void track('biometric_auth_failed', { reason: 'cancelled_or_failed' });
      }
    } finally {
      setToggling(false);
    }
  }, [biometricEnabled, setBiometric]);

  if (!isAuthenticated) {
    return (
      <AnimatedScreen direction="fade-up">
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.Text entering={FadeInDown.duration(420)} style={styles.title}>Profile</Animated.Text>
          <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.guestCard}>
            <LinearGradient
              colors={[colors.gradStart, colors.gradEnd]}
              style={styles.avatar}
            >
              <Ionicons name="person-outline" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.guestTitle}>Guest mode</Text>
            <Text style={styles.guestDesc}>
              Sign in to access your wallet, saved addresses, and shipment history.
            </Text>
            <View style={styles.guestActions}>
              <PressableScale
                style={styles.loginBtn}
                onPress={() => router.push('/auth/login')}
                haptic="light"
              >
                <Text style={styles.loginText}>Sign In</Text>
              </PressableScale>
              <PressableScale
                style={styles.registerBtn}
                onPress={() => router.push('/auth/register')}
                haptic="light"
              >
                <Text style={styles.registerText}>Create Account</Text>
              </PressableScale>
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.duration(420).delay(140)} style={styles.version}>
            ShipEasy Canada · v{(Constants.expoConfig as any)?.version ?? '1.0.0'}
          </Animated.Text>
        </ScrollView>
      </AnimatedScreen>
    );
  }

  const appVersion = (Constants.expoConfig as any)?.version ?? '1.0.0';
  const buildNumber =
    (Constants.expoConfig as any)?.ios?.buildNumber ??
    (Constants.expoConfig as any)?.android?.versionCode ??
    '1';
  const [, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatedScreen direction="fade-up">
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.title}>Profile</Animated.Text>

        <Animated.View entering={FadeInDown.duration(420).delay(40)} style={styles.profileCard}>
          <LinearGradient
            colors={[colors.gradStart, colors.gradEnd]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileMeta}>
              {user?.email} · Member since {memberSince}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(420).delay(80)} style={styles.carrierCard}>
          <View style={styles.carrierIcon}>
            <Ionicons name="car-sport" size={20} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.carrierHeader}>
              <Text style={styles.carrierTitle}>Stallion Express</Text>
              <View style={styles.carrierBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.green} />
                <Text style={styles.carrierBadgeText}>Connected</Text>
              </View>
            </View>
            <Text style={styles.carrierSub}>Last sync · {formatTimeAgo(Date.now() - 2 * 60_000)}</Text>
          </View>
        </Animated.View>

        <Group style={styles.group}>
          {PROFILE_PRIMARY.map((item, i) => (
            <StaggeredItem key={item.label} index={i} delayStep={40} duration={340}>
              <Cell
                icon={item.icon}
                label={item.label}
                chevron
                onPress={() => router.push(item.route as any)}
              >
                <View />
              </Cell>
            </StaggeredItem>
          ))}
        </Group>

        <StaggeredItem index={PROFILE_PRIMARY.length} delayStep={40}>
          <Group style={styles.group}>
            <TouchableOpacity style={styles.bioRow} onPress={toggleBiometric} activeOpacity={0.6}>
              <View style={styles.cellIcon}>
                <Ionicons name="finger-print" size={18} color={colors.ink} />
              </View>
              <Text style={styles.cellLabel}>Biometric lock</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
                thumbColor={biometricEnabled ? colors.accent : '#fff'}
                disabled={toggling}
              />
            </TouchableOpacity>
          </Group>
        </StaggeredItem>

        <StaggeredItem index={PROFILE_PRIMARY.length + 1} delayStep={40}>
          <Group style={styles.group}>
            <Cell
              icon="shield-checkmark-outline"
              label="Privacy policy"
              chevron
              onPress={() => router.push(PRIVACY_URL as any)}
            >
              <View />
            </Cell>
            <Cell
              icon="document-text-outline"
              label="Terms of service"
              chevron
              onPress={() => router.push(TERMS_URL as any)}
            >
              <View />
            </Cell>
          </Group>
        </StaggeredItem>

        <StaggeredItem index={PROFILE_PRIMARY.length + 2} delayStep={40}>
          <PressableScale
            style={styles.lockBtn}
            onPress={() => {
              if (!biometricEnabled) {
                Alert.alert(
                  'No lock enabled',
                  'Enable a biometric or PIN lock in Security to use this.',
                  [{ text: 'OK' }],
                );
                return;
              }
              lockNow();
              Haptics.success();
              toast.success('App locked');
              router.replace('/(tabs)/wallet');
            }}
            haptic="warning"
          >
            <Ionicons name="lock-closed-outline" size={16} color={colors.accent} />
            <Text style={styles.lockText}>Lock app</Text>
          </PressableScale>
        </StaggeredItem>

        <StaggeredItem index={PROFILE_PRIMARY.length + 3} delayStep={40}>
          <PressableScale style={styles.logoutBtn} onPress={logout} haptic="warning">
            <Ionicons name="log-out-outline" size={16} color={colors.red} />
            <Text style={styles.logoutText}>Log out</Text>
          </PressableScale>
        </StaggeredItem>

        <Animated.Text entering={FadeInDown.duration(360).delay(220)} style={styles.version}>
          ShipEasy Canada · v{appVersion} ({buildNumber})
        </Animated.Text>
      </ScrollView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, marginTop: 6, color: colors.ink },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 22 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4, color: colors.ink },
  profileMeta: { fontSize: 13.5, color: colors.faint, marginTop: 2 },
  group: { marginTop: spacing.lg },
  carrierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  carrierIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carrierHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  carrierTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  carrierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.greenSoft,
  },
  carrierBadgeText: { fontSize: 10.5, fontWeight: '700', color: colors.green, letterSpacing: 0.3 },
  carrierSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  cellIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.ink },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xl,
  },
  logoutText: { color: colors.red, fontSize: 15, fontWeight: '600' },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
  },
  lockText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, color: colors.faint, marginTop: 18 },
  guestCard: {
    alignItems: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: 8,
  },
  guestTitle: { fontSize: 19, fontWeight: '700', color: colors.ink },
  guestDesc: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  guestActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  loginBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.sm,
  },
  loginText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  registerBtn: {
    backgroundColor: colors.surface2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.sm,
  },
  registerText: { color: colors.ink, fontWeight: '600', fontSize: 15 },
});
