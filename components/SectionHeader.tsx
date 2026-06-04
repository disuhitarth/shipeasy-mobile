import React from 'react';
import { View, ViewStyle, StyleProp, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { PressableScale } from './PressableScale';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap };
  style?: StyleProp<ViewStyle>;
  align?: 'left' | 'center';
  delay?: number;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  style,
  align = 'left',
  delay = 0,
}: SectionHeaderProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingHorizontal: spacing['2xl'],
          marginBottom: spacing.md,
          marginTop: spacing.lg,
        },
        align === 'center' && { flexDirection: 'column', alignItems: 'center' },
        style,
      ]}
    >
      <View style={{ flex: 1, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        {eyebrow && (
          <Animated.Text
            entering={FadeInRight.delay(delay + 60).springify()}
            style={[typography.eyebrow, { color: colors.accent, marginBottom: 6 }]}
          >
            {eyebrow}
          </Animated.Text>
        )}
        <Animated.Text
          style={[
            align === 'center' ? typography.largeTitle : typography.title2,
            { color: colors.ink, textAlign: align === 'center' ? 'center' : 'left' },
          ]}
        >
          {title}
        </Animated.Text>
        {subtitle && (
          <Animated.Text
            entering={FadeInDown.delay(delay + 120).springify()}
            style={[
              typography.caption,
              { color: colors.muted, marginTop: 4, textAlign: align === 'center' ? 'center' : 'left' },
            ]}
          >
            {subtitle}
          </Animated.Text>
        )}
      </View>
      {action && (
        <PressableScale onPress={action.onPress} haptic="light">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: borderRadius.full,
              backgroundColor: colors.accentSoft,
            }}
          >
            {action.icon && <Ionicons name={action.icon} size={14} color={colors.accent} />}
            <Text style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>{action.label}</Text>
          </View>
        </PressableScale>
      )}
    </Animated.View>
  );
}

interface ListDividerProps {
  style?: StyleProp<ViewStyle>;
}

export function ListDivider({ style }: ListDividerProps) {
  return <View style={[{ height: 1, backgroundColor: colors.hairline, marginHorizontal: spacing['2xl'] }, style]} />;
}

interface FootnoteProps {
  text: string;
  style?: StyleProp<ViewStyle>;
}

export function Footnote({ text, style }: FootnoteProps) {
  return (
    <Animated.Text
      entering={FadeInDown.springify()}
      style={[
        typography.caption,
        { color: colors.faint, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing['2xl'] },
        style,
      ]}
    >
      {text}
    </Animated.Text>
  );
}

export default SectionHeader;
