import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useSettings } from '@/store/settings';
import { toast } from '@/lib/toast';
import { light, success } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Group } from '@/components/ui/Cell';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';

const LANGUAGES = [
  { code: 'en', label: 'English', sub: 'Default', flag: '🇨🇦' },
  { code: 'fr', label: 'Français', sub: 'Bientôt disponible', flag: '🇫🇷' },
] as const;

export default function AppearanceScreen() {
  const system = useColorScheme();
  const prefs = useSettings((s) => s.appearancePrefs);
  const setPref = useSettings((s) => s.setAppearancePref);
  const [followingSystem, setFollowingSystem] = useState(false);

  useEffect(() => {
    if (prefs.darkMode === null) {
      setFollowingSystem(true);
    }
  }, [prefs.darkMode]);

  const handleDark = (val: boolean) => {
    light();
    setFollowingSystem(false);
    setPref('darkMode', val as any);
    toast.info(val ? 'Dark mode enabled' : 'Light mode enabled');
  };

  const handleSystem = (val: boolean) => {
    light();
    setFollowingSystem(val);
    if (val) {
      setPref('darkMode', (system === 'dark') as any);
      toast.info('Following system theme');
    }
  };

  const handleLanguage = (code: 'en' | 'fr') => {
    light();
    setPref('language', code);
    if (code === 'en') {
      success();
      toast.success('Language set to English');
    } else {
      toast.info('Français — bientôt disponible');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Appearance" showBack />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="color-palette-outline" size={28} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Make it yours</Text>
          <Text style={styles.heroSub}>Customize how ShipEasy looks and reads</Text>
        </View>

        <Text style={styles.section}>Theme</Text>
        <Group>
          <View style={styles.themeRow}>
            <View style={[styles.themeIcon, { backgroundColor: colors.amberSoft }]}>
              <Ionicons name="sunny-outline" size={20} color={colors.amber} />
            </View>
            <View style={styles.themeInfo}>
              <Text style={styles.themeLabel}>Light</Text>
              <Text style={styles.themeSub}>Bright surfaces, dark text</Text>
            </View>
            <View style={[styles.preview, !prefs.darkMode && styles.previewActive]}>
              <View style={styles.previewInner} />
            </View>
          </View>
          <TouchableOpacity
            style={styles.themeRow}
            onPress={() => handleDark(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.themeIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="moon-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.themeInfo}>
              <Text style={styles.themeLabel}>Dark</Text>
              <Text style={styles.themeSub}>Easier on the eyes at night</Text>
            </View>
            <View style={[styles.preview, prefs.darkMode && styles.previewActiveDark]}>
              <View style={[styles.previewInner, { backgroundColor: colors.ink }]} />
            </View>
            {prefs.darkMode && <Ionicons name="checkmark" size={18} color={colors.accent} style={styles.checkmark} />}
          </TouchableOpacity>
          <View style={[styles.themeRow, styles.themeRowLast]}>
            <View style={[styles.themeIcon, { backgroundColor: colors.greenSoft }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.green} />
            </View>
            <View style={styles.themeInfo}>
              <Text style={styles.themeLabel}>Match system</Text>
              <Text style={styles.themeSub}>Currently {system === 'dark' ? 'dark' : 'light'}</Text>
            </View>
            <Switch
              value={followingSystem}
              onValueChange={handleSystem}
              trackColor={{ false: '#E5E5EA', true: '#C7C2FF' }}
              thumbColor={followingSystem ? colors.accent : '#fff'}
            />
          </View>
        </Group>

        <Text style={styles.section}>Language</Text>
        <Group>
          {LANGUAGES.map((lang, i) => {
            const active = prefs.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langRow, i === LANGUAGES.length - 1 && styles.langRowLast]}
                onPress={() => handleLanguage(lang.code)}
                activeOpacity={0.6}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={styles.langLabel}>{lang.label}</Text>
                  <Text style={styles.langSub}>{lang.sub}</Text>
                </View>
                {active && (
                  <View style={styles.langCheck}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Group>

        <Text style={styles.section}>Text size</Text>
        <Group>
          <View style={styles.textSizeRow}>
            <Text style={styles.textSizeLabel}>A</Text>
            <View style={styles.textSizeBar}>
              <View style={[styles.textSizeTick, styles.textSizeTickActive]} />
              <View style={[styles.textSizeTick, styles.textSizeTickActive]} />
              <View style={styles.textSizeTick} />
              <View style={styles.textSizeTick} />
            </View>
            <Text style={[styles.textSizeLabel, styles.textSizeLabelLarge]}>A</Text>
          </View>
          <View style={[styles.themeRow, styles.themeRowLast, { opacity: 0.6 }]}>
            <View style={[styles.themeIcon, { backgroundColor: colors.surface2 }]}>
              <Ionicons name="text-outline" size={20} color={colors.muted} />
            </View>
            <View style={styles.themeInfo}>
              <Text style={styles.themeLabel}>Custom text size</Text>
              <Text style={styles.themeSub}>Coming soon — uses system size today</Text>
            </View>
          </View>
        </Group>

        <View style={styles.footer}>
          <Ionicons name="sparkles-outline" size={16} color={colors.faint} />
          <Text style={styles.footerText}>
            Dark mode and additional languages are rolling out with the next major release.
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
  themeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  themeRowLast: { borderBottomWidth: 0 },
  themeIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  themeInfo: { flex: 1 },
  themeLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  themeSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  preview: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.hairline,
  },
  previewActive: { borderColor: colors.accent, borderWidth: 2 },
  previewActiveDark: { borderColor: colors.accent, borderWidth: 2, backgroundColor: '#0B0B12' },
  previewInner: { width: 14, height: 14, borderRadius: 4, backgroundColor: colors.surface },
  checkmark: { marginLeft: 8 },
  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  langRowLast: { borderBottomWidth: 0 },
  langFlag: { fontSize: 24 },
  langInfo: { flex: 1 },
  langLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  langSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  langCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  textSizeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  textSizeLabel: { fontSize: 16, fontWeight: '600', color: colors.ink },
  textSizeLabelLarge: { fontSize: 22 },
  textSizeBar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textSizeTick: { width: 4, height: 16, backgroundColor: colors.hairline, borderRadius: 2 },
  textSizeTickActive: { backgroundColor: colors.accent },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: spacing.md, marginTop: spacing.md },
  footerText: { flex: 1, fontSize: 12.5, color: colors.faint, lineHeight: 18 },
});
