import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import type { TextInput } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/store/auth';
import { validateEmail, validatePassword, validateForm, type ValidationResult } from '@/lib/validation';
import { toast } from '@/lib/toast';
import { FormField } from '@/components/ui/FormField';
import { PressableScale } from '@/components/PressableScale';
import { colors, spacing, borderRadius } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';
import {
  isLoginLocked,
  getLoginLockout,
  recordFailedLogin,
  recordSuccessfulLogin,
  getRemainingAttempts,
  LOGIN_LOCKOUT_MS,
  LOGIN_MAX_ATTEMPTS,
} from '@/lib/loginRateLimit';
import { checkAndRecordLogin, describeLocation } from '@/lib/analytics';

function formatSeconds(ms: number): string {
  const s = Math.max(1, Math.ceil(ms / 1000));
  return `${s}s`;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(LOGIN_MAX_ATTEMPTS);
  const [suspiciousNote, setSuspiciousNote] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const login = useAuth((s) => s.login);
  const enableGuest = useAuth((s) => s.enableGuest);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reason?: string }>();

  useEffect(() => {
    (async () => {
      const { lockedUntil: lu } = await getLoginLockout();
      setLockedUntil(lu);
      const rem = await getRemainingAttempts();
      setRemainingAttempts(rem);
    })();
  }, []);

  useEffect(() => {
    if (params.reason === 'timeout') {
      toast.info('Signed out due to inactivity');
    }
  }, [params.reason]);

  useEffect(() => {
    if (lockedUntil == null) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  useEffect(() => {
    if (lockedUntil == null) return;
    if (Date.now() >= lockedUntil) {
      setLockedUntil(null);
      setRemainingAttempts(LOGIN_MAX_ATTEMPTS);
      getLoginLockout().then(() => {});
    }
  }, [tick, lockedUntil]);

  const lockRemainingMs = lockedUntil ? Math.max(0, lockedUntil - Date.now()) : 0;
  const isLocked = lockRemainingMs > 0;

  const validate = (): ValidationResult => {
    const r = validateForm({ email, password }, {
      email: validateEmail,
      password: validatePassword,
    });
    setErrors(r.errors);
    return r;
  };

  const handleLogin = async () => {
    if (isLocked) {
      toast.error(`Too many attempts, try again in ${formatSeconds(lockRemainingMs)}`);
      return;
    }
    setTouched({ email: true, password: true });
    const r = validate();
    if (!r.isValid) {
      const firstKey = Object.keys(r.errors)[0];
      if (firstKey === 'email') emailRef.current?.focus();
      else if (firstKey === 'password') passwordRef.current?.focus();
      toast.error('Please fix the highlighted fields');
      return;
    }
    setLoading(true);
    try {
      const suspicious = await checkAndRecordLogin().catch(() => null);
      await login(email.trim(), password);
      await recordSuccessfulLogin();
      if (suspicious?.suspicious) {
        setSuspiciousNote(`New sign-in from ${describeLocation(suspicious.current)}. ${suspicious.reasons.join('; ')}`);
      }
      Haptics.success();
      toast.success('Welcome back');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 150);
    } catch (e: any) {
      const result = await recordFailedLogin();
      setRemainingAttempts(LOGIN_MAX_ATTEMPTS - result.attempts);
      if (result.lockedUntil) {
        setLockedUntil(result.lockedUntil);
        Haptics.error();
        toast.error(`Too many attempts, try again in ${formatSeconds(LOGIN_LOCKOUT_MS)}`);
      } else if (result.attempts > 0) {
        toast.error(
          (e?.message || 'Could not sign in') +
            ` · ${LOGIN_MAX_ATTEMPTS - result.attempts} attempt${LOGIN_MAX_ATTEMPTS - result.attempts === 1 ? '' : 's'} left`,
        );
      } else {
        toast.error(e?.message || 'Could not sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const onBlur = (key: 'email' | 'password') => {
    setTouched((t) => ({ ...t, [key]: true }));
    const r = validate();
    setErrors(r.errors);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View entering={FadeInDown.duration(360)} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }} haptic="light">
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </PressableScale>
      </Animated.View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text entering={FadeInUp.duration(360).delay(80)} style={styles.title}>
          Welcome back
        </Animated.Text>
        <Animated.Text entering={FadeInUp.duration(360).delay(140)} style={styles.sub}>
          Sign in to your ShipEasy account
        </Animated.Text>

        {suspiciousNote && (
          <Animated.View entering={FadeInUp.duration(360)} style={styles.suspiciousBanner}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.suspiciousTitle}>Was this you?</Text>
              <Text style={styles.suspiciousText}>{suspiciousNote}</Text>
            </View>
          </Animated.View>
        )}

        {isLocked && (
          <Animated.View entering={FadeInUp.duration(360)} style={styles.lockBanner}>
            <Ionicons name="lock-closed" size={18} color={colors.red} />
            <Text style={styles.lockText}>
              Too many attempts, try again in {formatSeconds(lockRemainingMs)}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(360).delay(220)} style={styles.form}>
          <FormField
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); if (touched.email) validate(); }}
            onBlur={() => onBlur('email')}
            placeholder="you@example.com"
            error={touched.email ? errors.email : null}
            required
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            leftIcon="mail-outline"
            editable={!isLocked && !loading}
          />
          <FormField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); if (touched.password) validate(); }}
            onBlur={() => onBlur('password')}
            placeholder="Enter your password"
            error={touched.password ? errors.password : null}
            required
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            leftIcon="lock-closed-outline"
            editable={!isLocked && !loading}
          />
        </Animated.View>

        {!isLocked && remainingAttempts < LOGIN_MAX_ATTEMPTS && (
          <Text style={styles.attemptsNote}>
            {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining
          </Text>
        )}

        <Animated.View entering={FadeInUp.duration(360).delay(320)}>
          <PressableScale
            style={[styles.submitBtn, (loading || isLocked) && styles.submitBtnDisabled]}
            onPress={() => { Haptics.selection(); handleLogin(); }}
            disabled={loading || isLocked}
            haptic="success"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitText}>{isLocked ? `Locked (${formatSeconds(lockRemainingMs)})` : 'Sign In'}</Text>
            )}
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(360).delay(400)}>
          <PressableScale style={styles.guestBtn} onPress={() => { enableGuest(); router.replace('/(tabs)'); }} haptic="light" disabled={loading}>
            <Text style={styles.guestText}>Continue as guest</Text>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(360).delay(480)}>
          <PressableScale onPress={() => router.replace('/auth/register')} haptic="light">
            <Text style={styles.switchText}>
              Don’t have an account? <Text style={styles.switchLink}>Register</Text>
            </Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 60 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, marginTop: spacing.lg, color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginTop: spacing.xs },
  form: { gap: spacing.lg, marginTop: spacing['2xl'] },
  submitBtn: {
    height: 52, borderRadius: borderRadius.sm, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing['2xl'],
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  guestBtn: { height: 52, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  guestText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  switchText: { textAlign: 'center', color: colors.muted, fontSize: 14, marginTop: spacing['2xl'] },
  switchLink: { color: colors.accent, fontWeight: '600' },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.redSoft,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
  },
  lockText: { color: colors.red, fontSize: 14, fontWeight: '600', flex: 1 },
  attemptsNote: {
    textAlign: 'right',
    color: colors.amber,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 4,
  },
  suspiciousBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.amberSoft,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
  },
  suspiciousTitle: { fontSize: 13.5, fontWeight: '700', color: colors.amber },
  suspiciousText: { fontSize: 12.5, color: colors.amber, marginTop: 2, lineHeight: 17 },
});
