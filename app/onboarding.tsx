import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/store/settings';
import type { ShippingGoal } from '@/lib/localStore';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { toast } from '@/lib/toast';
import { track, page } from '@/lib/analytics';

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  gradient: [string, string, string];
}

const SLIDES: Slide[] = [
  {
    icon: 'cube',
    title: 'Ship anywhere',
    subtitle: 'Send packages to 200+ countries with the best Canadian rates.',
    gradient: ['#8B7BFF', '#635BFF', '#4B45D6'],
  },
  {
    icon: 'car-sport',
    title: 'Track in real-time',
    subtitle: 'Live tracking from pickup to delivery, with push notifications.',
    gradient: ['#A78BFA', '#7C3AED', '#5B21B6'],
  },
  {
    icon: 'wallet',
    title: 'Pay your way',
    subtitle: 'Top up your wallet or pay per label — your choice.',
    gradient: ['#F59E0B', '#D97706', '#B45309'],
  },
];

interface GoalOption {
  id: ShippingGoal;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { id: 'daily', label: 'Daily', icon: 'flash', description: 'I ship every day' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar', description: 'A few times a week' },
  { id: 'monthly', label: 'Monthly', icon: 'calendar-outline', description: 'Once or twice a month' },
  { id: 'occasionally', label: 'Occasionally', icon: 'rocket-outline', description: 'Just once in a while' },
];

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [goal, setGoal] = useState<ShippingGoal | null>(null);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const setLastSeenVersion = useSettings((s) => s.setLastSeenVersion);
  const setShippingGoal = useSettings((s) => s.setShippingGoal);
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const appVersion = (Constants.expoConfig?.version as string) || '1.0.0';
  const buildNumber =
    (Constants.expoConfig as any)?.ios?.buildNumber ??
    (Constants.expoConfig as any)?.android?.versionCode ??
    '1';

  const isGoalStep = index === SLIDES.length;
  const isLast = isGoalStep;
  const slide = isGoalStep ? null : SLIDES[index];

  useEffect(() => {
    void page('onboarding', { slide: index, total: SLIDES.length + 1 });
    fade.setValue(0);
    translateX.setValue(index === 0 ? 20 : -20);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [index, fade, translateX]);

  const finish = async () => {
    if (goal) await setShippingGoal(goal);
    await setOnboarded(true);
    const version = appVersion;
    await setLastSeenVersion(version);
    void track('app_open', { source: 'onboarding_finished', version, shippingGoal: goal });
    router.replace('/(tabs)');
  };

  const next = () => {
    if (isLast) {
      if (!goal) {
        toast.error('Pick a goal to personalise your home screen');
        return;
      }
      finish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const skip = async () => {
    await finish();
    toast.info('You can revisit this anytime from Profile');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot}>
            <Ionicons name="cube" size={16} color={colors.white} />
          </View>
          <Text style={styles.brandText}>ShipEasy</Text>
        </View>
        {!isLast ? (
          <TouchableOpacity onPress={skip} style={styles.skipBtn} activeOpacity={0.6}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtn} />
        )}
      </View>

      {!isGoalStep ? (
        <>
          <View style={styles.illustration}>
            <Animated.View
              style={{
                opacity: fade,
                transform: [{ translateX }],
                alignItems: 'center',
              }}
            >
              <LinearGradient
                colors={slide!.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name={slide!.icon} size={64} color={colors.white} />
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={styles.textBlock}>
            <Animated.View style={{ opacity: fade, transform: [{ translateX }] }}>
              <Text style={styles.title}>{slide!.title}</Text>
              <Text style={styles.subtitle}>{slide!.subtitle}</Text>
            </Animated.View>
          </View>
        </>
      ) : (
        <View style={styles.goalBlock}>
          <View style={styles.goalHeader}>
            <Ionicons name="rocket" size={36} color={colors.accent} />
            <Text style={styles.title}>What's your shipping goal?</Text>
            <Text style={styles.subtitle}>
              We'll personalise your home screen with tips and shortcuts that match your pace.
            </Text>
          </View>
          <View style={styles.goalGrid}>
            {GOAL_OPTIONS.map((opt) => {
              const selected = goal === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.85}
                  style={[styles.goalCard, selected && styles.goalCardActive]}
                  onPress={() => {
                    setGoal(opt.id);
                  }}
                >
                  <View style={[styles.goalIcon, selected && styles.goalIconActive]}>
                    <Ionicons name={opt.icon} size={22} color={selected ? '#fff' : colors.accent} />
                  </View>
                  <Text style={[styles.goalLabel, selected && styles.goalLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.goalDesc, selected && styles.goalDescActive]}>
                    {opt.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.dots}>
        {[...SLIDES, { title: 'goal' }].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity
          style={[
            styles.cta,
            {
              backgroundColor: isLast
                ? goal
                  ? colors.accent
                  : colors.faint
                : (slide?.gradient[1] ?? colors.accent),
            },
          ]}
          onPress={next}
          activeOpacity={0.9}
          disabled={isLast && !goal}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get started' : 'Next'}</Text>
          <Ionicons
            name={isLast ? 'checkmark' : 'arrow-forward'}
            size={18}
            color={colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.version}>v{appVersion} · build {String(buildNumber)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandDot: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  skipBtn: {
    minWidth: 60,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.muted,
  },
  illustration: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 12,
  },
  textBlock: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 15.5,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.hairline,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.accent,
  },
  footer: {
    paddingTop: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    height: 56,
    borderRadius: borderRadius.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 6,
  },
  ctaText: {
    color: colors.white,
    fontSize: 16.5,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    color: colors.faint,
  },
  goalBlock: {
    flex: 1.2,
    justifyContent: 'center',
  },
  goalHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xl,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  goalCard: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 22,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  goalCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  goalIconActive: {
    backgroundColor: colors.accent,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  goalLabelActive: {
    color: colors.accent,
  },
  goalDesc: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  goalDescActive: {
    color: colors.accent,
    opacity: 0.7,
  },
});

void width;
