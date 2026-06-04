import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';
import { reportError } from '@/lib/errorReporting';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const SUPPORT_EMAIL = 'support@shipeasycanada.com';

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
    void reportError(error, {
      action: 'ErrorBoundary',
      extra: { componentStack: info.componentStack },
    });
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  private buildReportMailto() {
    const subject = encodeURIComponent('ShipEasy App Error Report');
    const body = encodeURIComponent(
      [
        'Hi ShipEasy team,',
        '',
        'I encountered an error while using the app:',
        '',
        '---',
        `Message: ${this.state.error?.message ?? 'Unknown'}`,
        `Stack: ${this.state.error?.stack ?? 'N/A'}`,
        '---',
        '',
        'Additional context:',
        '',
      ].join('\n'),
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#8B7BFF', '#635BFF', '#4B45D6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="alert-circle" size={48} color={colors.white} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app ran into an unexpected issue. You can try again, or send us a report so we can fix it.
            </Text>
            {this.state.error?.message ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} numberOfLines={4}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}
            <Pressable style={styles.primaryBtn} onPress={this.reset} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
              <Ionicons name="refresh" size={18} color={colors.accent} />
              <Text style={styles.primaryBtnText}>Try again</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                const url = this.buildReportMailto();
                if (typeof window !== 'undefined' && typeof window.open === 'function') {
                  window.open(url, '_blank');
                }
              }}
              android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            >
              <Ionicons name="mail-outline" size={18} color={colors.white} />
              <Text style={styles.secondaryBtnText}>Report issue</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15.5,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    maxWidth: 340,
  },
  errorBox: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    maxWidth: 360,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  errorText: {
    fontFamily: 'ui-monospace',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 17,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: 14,
    borderRadius: borderRadius.full,
    marginTop: spacing['2xl'],
    ...shadows.md,
  },
  primaryBtnText: {
    color: colors.accent,
    fontSize: 15.5,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: 14,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  secondaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
