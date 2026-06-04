import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '@/store/auth';
import { useBiometric } from '@/store/biometric';
import { Cell, Group } from '@/components/ui/Cell';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { useState, useCallback } from 'react';

export default function ProfileScreen() {
  const { isAuthenticated, user, logout } = useAuth();
  const biometricEnabled = useBiometric((s) => s.enabled);
  const setBiometric = useBiometric((s) => s.setEnabled);
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
      return;
    }
    setToggling(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not available', 'Biometric authentication is not available on this device');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Not set up', 'No biometrics enrolled. Set up Face ID / fingerprint in system settings.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric lock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        await setBiometric(true);
      }
    } finally {
      setToggling(false);
    }
  }, [biometricEnabled, setBiometric]);

  const handleRowPress = (label: string) => {
    switch (label) {
      case 'Personal details':
        Alert.alert('Personal details', 'Coming soon');
        break;
      case 'Address book':
        router.push('/addresses');
        break;
      case 'Payment methods':
        Alert.alert('Payment methods', 'Coming soon');
        break;
      case 'Security':
        Alert.alert('Security', 'Coming soon');
        break;
      case 'Notifications':
        Alert.alert('Notifications', 'Coming soon');
        break;
      case 'Help & support':
        Alert.alert('Help & support', 'Coming soon');
        break;
    }
  };

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.guestCard}>
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
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.registerText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.version}>ShipEasy Canada · v1.0.0</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
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
      </View>

      <Group style={styles.group}>
        <Cell icon="person-outline" label="Personal details" chevron onPress={() => handleRowPress('Personal details')}><View /></Cell>
        <Cell icon="location-outline" label="Address book" chevron onPress={() => handleRowPress('Address book')}><View /></Cell>
        <Cell icon="wallet-outline" label="Payment methods" chevron onPress={() => handleRowPress('Payment methods')}><View /></Cell>
        <Cell icon="shield-outline" label="Security" chevron onPress={() => handleRowPress('Security')}><View /></Cell>
        <Cell icon="notifications-outline" label="Notifications" chevron onPress={() => handleRowPress('Notifications')}><View /></Cell>
        <Cell icon="info-circle-outline" label="Help & support" chevron onPress={() => handleRowPress('Help & support')}><View /></Cell>
      </Group>

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

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={16} color={colors.red} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>ShipEasy Canada · v1.0.0</Text>
    </ScrollView>
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
