import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '@/store/auth';
import { useBiometric } from '@/store/biometric';
import { useState, useCallback } from 'react';

const SETTINGS_ROWS = [
  { icon: 'person' as const, label: 'Personal details' },
  { icon: 'location' as const, label: 'Address book' },
  { icon: 'card' as const, label: 'Payment methods' },
  { icon: 'information-circle' as const, label: 'Help & support' },
];

export default function ProfileScreen() {
  const { isAuthenticated, user, logout, enableGuest } = useAuth();
  const biometricEnabled = useBiometric((s) => s.enabled);
  const setBiometric = useBiometric((s) => s.setEnabled);
  const lock = useBiometric((s) => s.lock);
  const [toggling, setToggling] = useState(false);

  const toggleBiometric = useCallback(async () => {
    if (biometricEnabled) {
      // Disable — no auth required
      await setBiometric(false);
      return;
    }

    // Enable — verify identity first
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
        promptMessage: 'Enable wallet lock',
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      {isAuthenticated && user ? (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileMeta}>{user.email}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <Ionicons name="person-circle-outline" size={48} color="#635BFF" />
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
      )}

      {/* Settings */}
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsSection}>General</Text>
        {SETTINGS_ROWS.map((row) => (
          <TouchableOpacity key={row.label} style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <Ionicons name={row.icon} size={18} color="#0B0B12" />
            </View>
            <Text style={styles.settingsLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9A9AA4" />
          </TouchableOpacity>
        ))}

        <Text style={styles.settingsSection}>Security</Text>

        {/* Biometric toggle */}
        <View style={styles.settingsRow}>
          <View style={styles.settingsIcon}>
            <Ionicons name="finger-print" size={18} color="#0B0B12" />
          </View>
          <Text style={styles.settingsLabel}>Lock wallet with biometrics</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
            thumbColor={biometricEnabled ? '#635BFF' : '#fff'}
            disabled={toggling}
          />
        </View>
      </View>

      {isAuthenticated && (
        <>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out" size={16} color="#E0483D" />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.lockBtn} onPress={() => { lock(); router.replace('/(tabs)'); }}>
            <Ionicons name="lock-closed" size={16} color="#9A9AA4" />
            <Text style={styles.lockText}>Lock wallet now</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.version}>ShipEasy Canada · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, marginTop: 6 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    marginTop: 12,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 22 },
  profileName: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
  profileMeta: { fontSize: 13.5, color: '#9A9AA4', marginTop: 2 },
  guestCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 22,
    marginTop: 12,
    gap: 8,
  },
  guestTitle: { fontSize: 19, fontWeight: '700', color: '#0B0B12' },
  guestDesc: { fontSize: 14, color: '#6B6B76', textAlign: 'center', lineHeight: 20 },
  guestActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  loginBtn: {
    backgroundColor: '#635BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  loginText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  registerBtn: {
    backgroundColor: '#F7F7F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  registerText: { color: '#0B0B12', fontWeight: '600', fontSize: 15 },
  settingsGroup: { backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', marginTop: 16 },
  settingsSection: {
    fontSize: 12.5, fontWeight: '600', color: '#9A9AA4',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,10,20,0.07)',
  },
  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F7F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0B0B12' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 20,
  },
  logoutText: { color: '#E0483D', fontSize: 15, fontWeight: '600' },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    marginTop: 8,
  },
  lockText: { color: '#9A9AA4', fontSize: 14, fontWeight: '500' },
  version: { textAlign: 'center', fontSize: 12, color: '#9A9AA4', marginTop: 18 },
});
