import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { toast } from '@/lib/toast';
import { light } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Group } from '@/components/ui/Cell';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';

const PRIVACY_URL = 'https://shipeasyplus.netlify.app/privacy';
const TERMS_URL = 'https://shipeasyplus.netlify.app/terms';
const WEBSITE_URL = 'https://shipeasyplus.netlify.app';
const TWITTER_URL = 'https://twitter.com/shipeasyca';
const GITHUB_URL = 'https://github.com/disuhitarth';
const LICENSE_URL = 'https://shipeasyplus.netlify.app/licenses';

const ACKNOWLEDGEMENTS = [
  { name: 'Expo', description: 'React Native framework' },
  { name: 'TanStack Query', description: 'Data fetching & caching' },
  { name: 'Zustand', description: 'State management' },
  { name: 'Stripe', description: 'Payment processing' },
  { name: 'Stallion Express', description: 'Shipping API' },
  { name: 'Canada Post', description: 'Shipping API' },
  { name: 'Google Gemini', description: 'AI address parsing' },
  { name: 'MongoDB Atlas', description: 'Database hosting' },
  { name: 'Netlify', description: 'Web hosting' },
];

export default function AboutScreen() {
  const version = (Constants.expoConfig as any)?.version ?? '1.0.0';
  const buildNumber =
    (Constants.expoConfig as any)?.ios?.buildNumber ??
    (Constants.expoConfig as any)?.android?.versionCode ??
    '1';

  const openUrl = useCallback(async (url: string) => {
    try {
      light();
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url).catch(() => toast.error('Could not open link'));
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader title="About" showBack />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandCard}>
          <LinearGradient
            colors={[colors.gradStart, colors.gradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandLogo}
          >
            <Ionicons name="paper-plane" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandName}>ShipEasy</Text>
          <Text style={styles.brandTagline}>Canada's simplest shipping platform</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillText}>v{version} · build {buildNumber}</Text>
          </View>
        </View>

        <Text style={styles.section}>Legal</Text>
        <Group>
          <LinkRow
            icon="shield-checkmark-outline"
            iconColor={colors.accent}
            iconBg={colors.accentSoft}
            title="Privacy policy"
            onPress={() => openUrl(PRIVACY_URL)}
          />
          <LinkRow
            icon="document-text-outline"
            iconColor={colors.green}
            iconBg={colors.greenSoft}
            title="Terms of service"
            onPress={() => openUrl(TERMS_URL)}
          />
          <LinkRow
            icon="library-outline"
            iconColor={colors.amber}
            iconBg={colors.amberSoft}
            title="Open source licenses"
            onPress={() => openUrl(LICENSE_URL)}
            last
          />
        </Group>

        <Text style={styles.section}>Connect</Text>
        <Group>
          <LinkRow
            icon="globe-outline"
            iconColor={colors.accent}
            iconBg={colors.accentSoft}
            title="Visit website"
            subtitle={WEBSITE_URL.replace('https://', '')}
            onPress={() => openUrl(WEBSITE_URL)}
          />
          <LinkRow
            icon="logo-twitter"
            iconColor="#1DA1F2"
            iconBg="#E6F4FB"
            title="Follow on X (Twitter)"
            subtitle="@shipeasyca"
            onPress={() => openUrl(TWITTER_URL)}
          />
          <LinkRow
            icon="logo-github"
            iconColor={colors.ink}
            iconBg={colors.surface2}
            title="Source on GitHub"
            subtitle="github.com/disuhitarth"
            onPress={() => openUrl(GITHUB_URL)}
            last
          />
        </Group>

        <Text style={styles.section}>Acknowledgements</Text>
        <View style={styles.ackCard}>
          {ACKNOWLEDGEMENTS.map((item, i) => (
            <View key={item.name} style={[styles.ackRow, i === ACKNOWLEDGEMENTS.length - 1 && styles.ackRowLast]}>
              <View style={styles.ackBullet} />
              <View style={styles.ackInfo}>
                <Text style={styles.ackName}>{item.name}</Text>
                <Text style={styles.ackDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.credits}>
          <View style={styles.creditsRow}>
            <Ionicons name="heart" size={14} color={colors.red} />
            <Text style={styles.creditsText}>Made with care in Toronto, Canada</Text>
          </View>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} ShipEasy Inc. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function LinkRow({
  icon, iconColor, iconBg, title, subtitle, onPress, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.linkRow, last && styles.linkRowLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.linkIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.linkInfo}>
        <Text style={styles.linkTitle}>{title}</Text>
        {subtitle ? <Text style={styles.linkSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="open-outline" size={16} color={colors.faint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  bodyInner: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  brandCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing['3xl'], alignItems: 'center', ...shadows.sm,
  },
  brandLogo: {
    width: 76, height: 76, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  brandName: { fontSize: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.6, marginBottom: 4 },
  brandTagline: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: spacing.md },
  versionPill: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: borderRadius.full, backgroundColor: colors.surface2,
  },
  versionPillText: { fontSize: 12, color: colors.muted, fontWeight: '600', fontFamily: 'ui-monospace' },
  section: { ...typography.eyebrow, marginTop: spacing.md, paddingHorizontal: 4 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  linkRowLast: { borderBottomWidth: 0 },
  linkIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  linkSubtitle: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  ackCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, gap: 12, ...shadows.sm },
  ackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  ackRowLast: { paddingBottom: 0, borderBottomWidth: 0 },
  ackBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  ackInfo: { flex: 1 },
  ackName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  ackDesc: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  credits: { alignItems: 'center', paddingTop: spacing.md, gap: 6 },
  creditsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creditsText: { fontSize: 12.5, color: colors.muted, fontWeight: '500' },
  copyright: { fontSize: 11.5, color: colors.faint, textAlign: 'center' },
});
