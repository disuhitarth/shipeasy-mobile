import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useSettings } from '@/store/settings';
import { toast } from '@/lib/toast';
import { light, success, error, warning } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Group } from '@/components/ui/Cell';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';

interface ToggleRow {
  key: 'push' | 'labelUpdates' | 'walletAlerts' | 'marketing' | 'autoRefreshTracking';
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  requiresPermission?: boolean;
}

const ROWS: ToggleRow[] = [
  {
    key: 'push',
    icon: 'notifications',
    iconColor: colors.accent,
    iconBg: colors.accentSoft,
    title: 'Push notifications',
    description: 'Receive alerts on your device',
    requiresPermission: true,
  },
  {
    key: 'labelUpdates',
    icon: 'cube-outline',
    iconColor: colors.accent,
    iconBg: colors.accentSoft,
    title: 'Shipment updates',
    description: 'Picked up, in transit, delivered, exceptions',
  },
  {
    key: 'walletAlerts',
    icon: 'wallet-outline',
    iconColor: colors.amber,
    iconBg: colors.amberSoft,
    title: 'Wallet alerts',
    description: 'Low balance, top-up confirmation, auto-reload',
  },
  {
    key: 'marketing',
    icon: 'megaphone-outline',
    iconColor: colors.green,
    iconBg: colors.greenSoft,
    title: 'Marketing & offers',
    description: 'Promotions, rate changes, new features',
  },
  {
    key: 'autoRefreshTracking',
    icon: 'pulse-outline',
    iconColor: colors.green,
    iconBg: colors.greenSoft,
    title: 'Auto-refresh tracking',
    description: 'Poll carrier every 30s on the detail screen',
  },
];

export default function NotificationsScreen() {
  const prefs = useSettings((s) => s.notificationPrefs);
  const setPref = useSettings((s) => s.setNotificationPref);
  const loaded = useSettings((s) => s.loaded);

  const permissionStatus = useCallback(async () => {
    if (Platform.OS === 'web') return 'granted' as const;
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') return 'granted' as const;
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  }, []);

  const handleToggle = useCallback(
    async (row: ToggleRow) => {
      const next = !prefs[row.key];
      if (row.key === 'autoRefreshTracking') {
        await setPref(row.key, next);
        light();
        if (next) toast.success('Auto-refresh tracking enabled');
        else toast.info('Auto-refresh disabled — manual only');
        return;
      }
      if (next && row.requiresPermission) {
        const current = await permissionStatus();
        if (current !== 'granted') {
          const granted = await requestPermission();
          if (granted !== 'granted') {
            warning();
            toast.warning('Notifications blocked — enable in system settings');
            return;
          }
        }
      }
      if (!next && row.key === 'push') {
        light();
        AlertTurnOffOthers(row.key);
        return;
      }
      await setPref(row.key, next);
      light();
      if (next) toast.success(`${row.title} enabled`);
      else toast.info(`${row.title} disabled`);
    },
    [prefs, setPref, permissionStatus, requestPermission],
  );

  function AlertTurnOffOthers(_key: 'push') {
    Promise.all([
      setPref('labelUpdates', false),
      setPref('walletAlerts', false),
      setPref('marketing', false),
    ]).then(() => {
      toast.info('All push notifications disabled');
    });
  }

  const pushOn = prefs.push && prefs.labelUpdates && prefs.walletAlerts && prefs.marketing;
  const allOff = !prefs.push && !prefs.labelUpdates && !prefs.walletAlerts && !prefs.marketing;

  const toggleAll = async () => {
    const next = !pushOn;
    await Promise.all([
      setPref('push', next),
      setPref('labelUpdates', next),
      setPref('walletAlerts', next),
      setPref('marketing', next),
    ]);
    if (next && next === true) {
      const status = await permissionStatus();
      if (status !== 'granted') await requestPermission();
      success();
      toast.success('All notifications enabled');
    } else {
      light();
      toast.info('All notifications disabled');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" showBack />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="notifications" size={28} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Stay in the loop</Text>
          <Text style={styles.heroSub}>Choose what we send your way</Text>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, pushOn && styles.quickBtnOn]}
            onPress={toggleAll}
            activeOpacity={0.7}
          >
            <Ionicons
              name={pushOn ? 'notifications-off-outline' : 'notifications-outline'}
              size={18}
              color={pushOn ? '#fff' : colors.ink}
            />
            <Text style={[styles.quickText, pushOn && styles.quickTextOn]}>
              {pushOn ? 'Mute everything' : allOff ? 'Enable all' : 'Enable all'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Channels</Text>
        <Group>
          {ROWS.map((row, i) => (
            <View
              key={row.key}
              style={[styles.row, i === ROWS.length - 1 && styles.rowLast]}
            >
              <View style={[styles.rowIcon, { backgroundColor: row.iconBg }]}>
                <Ionicons name={row.icon} size={18} color={row.iconColor} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowSub}>{row.description}</Text>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={() => handleToggle(row)}
                trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
                thumbColor={prefs[row.key] ? colors.accent : '#fff'}
              />
            </View>
          ))}
        </Group>

        <Text style={styles.section}>Quiet hours</Text>
        <Group>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.surface2 }]}>
              <Ionicons name="moon-outline" size={18} color={colors.muted} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Do not disturb</Text>
              <Text style={styles.rowSub}>Pause all non-critical alerts</Text>
            </View>
            <Switch
              value={false}
              disabled
              trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
              thumbColor={'#fff'}
            />
          </View>
          <View style={[styles.row, styles.rowLast, { opacity: 0.6 }]}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowSubMuted}>
                Scheduled quiet hours are coming in a future update.
              </Text>
            </View>
          </View>
        </Group>

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.faint} />
          <Text style={styles.footerText}>
            You can also manage system-level permissions in your device settings.
            Critical security alerts will always be delivered.
          </Text>
        </View>
      </ScrollView>
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
    ...shadows.sm,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  heroTitle: { ...typography.title3, marginBottom: 4 },
  heroSub: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: borderRadius.sm,
    backgroundColor: colors.surface, ...shadows.sm,
  },
  quickBtnOn: { backgroundColor: colors.ink },
  quickText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  quickTextOn: { color: '#fff' },
  section: { ...typography.eyebrow, marginTop: spacing.md, paddingHorizontal: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  rowSubMuted: { fontSize: 12.5, color: colors.faint, fontStyle: 'italic' },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: spacing.md, marginTop: spacing.md },
  footerText: { flex: 1, fontSize: 12.5, color: colors.faint, lineHeight: 18 },
});
