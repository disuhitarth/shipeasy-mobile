import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, shadows, typography } from '@/lib/theme';

interface BaseProps {
  children: ReactNode;
  background?: string;
  scrollable?: boolean;
  contentStyle?: any;
  refreshControl?: React.ReactElement;
  keyboardOffset?: number;
}

interface WithTitle extends BaseProps {
  title: string;
  showBack?: boolean;
  right?: ReactNode;
  headerRight?: ReactNode;
}

interface WithoutTitle extends BaseProps {
  title?: undefined;
  showBack?: boolean;
  right?: ReactNode;
  headerRight?: ReactNode;
}

export type ScreenProps = WithTitle | WithoutTitle;

export const Screen: React.FC<ScreenProps> = (props) => {
  const {
    children,
    background = colors.bg,
    scrollable = false,
    contentStyle,
    refreshControl,
    keyboardOffset,
  } = props;

  const insets = useSafeAreaInsets();
  const showHeader = !!props.title || !!props.showBack || !!props.headerRight;
  const headerPadTop = insets.top + (props.title || props.showBack ? spacing.sm : 0);
  const bottomPad = Math.max(insets.bottom, spacing.lg);

  const content = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        { paddingHorizontal: spacing.xl, paddingBottom: bottomPad + 24 },
        contentStyle,
      ]}
      refreshControl={refreshControl as any}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingBottom: bottomPad }, contentStyle]}>{children}</View>
  );

  const inner = (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      {showHeader ? (
        <View
          style={[
            styles.header,
            { paddingTop: headerPadTop, paddingHorizontal: spacing.xl },
          ]}
        >
          <View style={styles.headerSide}>
            {props.showBack ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={22} color={colors.ink} />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.headerCenter}>
            {props.title ? (
              <View style={styles.titlePill}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {props.title}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.headerSide, styles.headerRight]}>{props.headerRight}</View>
        </View>
      ) : null}
      <View style={styles.flex}>{content}</View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={['left', 'right']}>
      {inner}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  headerSide: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    justifyContent: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 100,
    ...shadows.sm,
  },
  titleText: {
    ...typography.title3,
    fontSize: 14.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
});

export default Screen;
