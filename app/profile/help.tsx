import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { toast } from '@/lib/toast';
import { light } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Group } from '@/components/ui/Cell';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';

interface FaqItem {
  q: string;
  a: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FAQ: FaqItem[] = [
  {
    icon: 'card-outline',
    q: 'How do I add funds to my wallet?',
    a: 'Open the Wallet tab and tap "Add funds". Choose a preset amount or enter a custom value, then complete payment with your saved card or Apple Pay. Funds appear in your wallet within seconds.',
  },
  {
    icon: 'cube-outline',
    q: 'What carriers do you support?',
    a: 'We rate-shop across Canada Post, Stallion Express, and Asendia. You will see live rates and delivery times for each service before you commit to a label.',
  },
  {
    icon: 'refresh-outline',
    q: 'Can I void a label after purchase?',
    a: 'Yes. Open the shipment, tap the menu, and choose "Void label". We refund the label cost to your wallet if the carrier has not yet scanned the package.',
  },
  {
    icon: 'globe-outline',
    q: 'Which countries can I ship to?',
    a: 'We currently ship to 220+ destinations. The destination country picker on the recipient address shows which services are available for each route.',
  },
  {
    icon: 'lock-closed-outline',
    q: 'Is my payment information secure?',
    a: 'All card data is tokenized and stored by Stripe — we never see or store raw card numbers. Your ShipEasy account is protected with device-level encryption and optional biometric lock.',
  },
  {
    icon: 'business-outline',
    q: 'Do you offer business accounts?',
    a: 'Yes. Contact our team to enable volume pricing, multi-user workspaces, and invoiced billing for your team.',
  },
];

const SUPPORT_EMAIL = 'support@shipeasyplus.com';
const HELP_URL = 'https://shipeasyplus.netlify.app/help';

export default function HelpScreen() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [opening, setOpening] = useState(false);

  const toggle = (i: number) => {
    light();
    setOpenIdx((cur) => (cur === i ? null : i));
  };

  const openUrl = useCallback(async (url: string) => {
    try {
      setOpening(true);
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url).catch(() => toast.error('Could not open link'));
    } finally {
      setOpening(false);
    }
  }, []);

  const emailSupport = () => {
    const subject = encodeURIComponent('ShipEasy support request');
    const body = encodeURIComponent(
      `Hi ShipEasy team,\n\nI need help with:\n\nApp version: ${Constants.expoConfig?.version ?? '1.0.0'}\n\n`,
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {
      toast.error('No email app available');
    });
  };

  const version = (Constants.expoConfig as any)?.version ?? '1.0.0';
  const buildNumber =
    (Constants.expoConfig as any)?.ios?.buildNumber ??
    (Constants.expoConfig as any)?.android?.versionCode ??
    '1';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Help & support" showBack />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy" size={28} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Browse common questions or reach our team</Text>
        </View>

        <Text style={styles.section}>Contact us</Text>
        <Group>
          <ContactRow
            icon="mail-outline"
            iconColor={colors.accent}
            iconBg={colors.accentSoft}
            title="Email support"
            subtitle={SUPPORT_EMAIL}
            onPress={emailSupport}
          />
          <ContactRow
            icon="globe-outline"
            iconColor={colors.green}
            iconBg={colors.greenSoft}
            title="Help center"
            subtitle="Browse guides and tutorials"
            onPress={() => openUrl(HELP_URL)}
            loading={opening}
          />
          <ContactRow
            icon="chatbubbles-outline"
            iconColor={colors.amber}
            iconBg={colors.amberSoft}
            title="Live chat"
            subtitle="Available Mon–Fri, 9 AM – 6 PM ET"
            onPress={() => toast.info('Live chat coming soon')}
            last
          />
        </Group>

        <Text style={styles.section}>Frequently asked</Text>
        <View style={styles.faqCard}>
          {FAQ.map((item, i) => {
            const open = openIdx === i;
            return (
              <View key={i} style={[styles.faqItem, i === FAQ.length - 1 && styles.faqItemLast]}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggle(i)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqIcon}>
                    <Ionicons name={item.icon} size={16} color={colors.accent} />
                  </View>
                  <Text style={styles.faqQ}>{item.q}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.faint}
                  />
                </TouchableOpacity>
                {open && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqA}>{item.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.section}>App info</Text>
        <Group>
          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
            </View>
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Version</Text>
              <Text style={styles.metaValue}>{version} ({buildNumber})</Text>
            </View>
          </View>
          <View style={[styles.metaRow, styles.metaRowLast]}>
            <View style={styles.metaIcon}>
              <Ionicons name="document-text-outline" size={16} color={colors.muted} />
            </View>
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Terms & privacy</Text>
              <Text style={styles.metaValue}>Tap "About" to view legal</Text>
            </View>
            <TouchableOpacity
              style={styles.metaAction}
              onPress={() => router.push({ pathname: '/profile/about' } as any)}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.faint} />
            </TouchableOpacity>
          </View>
        </Group>

        <Text style={styles.thanks}>ShipEasy Canada · Made with care in Toronto</Text>
      </ScrollView>
    </View>
  );
}

function ContactRow({
  icon, iconColor, iconBg, title, subtitle, onPress, loading, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  loading?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.contactRow, last && styles.contactRowLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.contactIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  bodyInner: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  heroCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.xl, alignItems: 'center', ...shadows.sm,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  heroTitle: { ...typography.title3, marginBottom: 4 },
  heroSub: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  section: { ...typography.eyebrow, marginTop: spacing.md, paddingHorizontal: 4 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  contactRowLast: { borderBottomWidth: 0 },
  contactIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  contactSubtitle: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  faqCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, ...shadows.sm, overflow: 'hidden' },
  faqItem: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  faqItemLast: { borderBottomWidth: 0 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14, paddingHorizontal: 16 },
  faqIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  faqQ: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.ink },
  faqBody: { paddingHorizontal: 16, paddingBottom: 16, paddingLeft: 60 },
  faqA: { fontSize: 13.5, color: colors.muted, lineHeight: 20 },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  metaRowLast: { borderBottomWidth: 0 },
  metaIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  metaInfo: { flex: 1 },
  metaLabel: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  metaValue: { fontSize: 14, color: colors.ink, fontWeight: '500', marginTop: 2 },
  metaAction: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  thanks: { textAlign: 'center', fontSize: 12, color: colors.faint, marginTop: spacing.lg },
});
