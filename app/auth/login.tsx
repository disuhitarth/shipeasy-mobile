import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { TextInput } from 'react-native';
import { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/store/auth';
import { validateEmail, validatePassword, validateForm, type ValidationResult } from '@/lib/validation';
import { toast } from '@/lib/toast';
import { FormField } from '@/components/ui/FormField';
import { PressableScale } from '@/components/PressableScale';
import { colors, spacing, borderRadius } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const login = useAuth((s) => s.login);
  const enableGuest = useAuth((s) => s.enableGuest);
  const insets = useSafeAreaInsets();

  const validate = (): ValidationResult => {
    const r = validateForm({ email, password }, {
      email: validateEmail,
      password: validatePassword,
    });
    setErrors(r.errors);
    return r;
  };

  const handleLogin = async () => {
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
      await login(email.trim(), password);
      toast.success('Welcome back');
      router.back();
    } catch (e: any) {
      toast.error(e?.message || 'Could not sign in');
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
        <PressableScale style={styles.backBtn} onPress={() => router.back()} haptic="light">
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
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(360).delay(320)}>
          <PressableScale
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={() => { Haptics.success(); handleLogin(); }}
            disabled={loading}
            haptic="success"
          >
            <Text style={styles.submitText}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Text>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(360).delay(400)}>
          <PressableScale style={styles.guestBtn} onPress={() => { enableGuest(); router.back(); }} haptic="light">
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
});
