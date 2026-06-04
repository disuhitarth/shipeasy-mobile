import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  ViewStyle,
  StyleProp,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { ShakeView } from '@/components/ShakeView';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  shakeTrigger?: number;
  success?: boolean;
  helper?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FormField({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  required,
  containerStyle,
  inputStyle,
  shakeTrigger,
  success,
  helper,
  size = 'md',
  onFocus,
  onBlur,
  value,
  ...rest
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [focused, focusProgress]);

  const borderStyle = useAnimatedStyle(() => {
    const p = focusProgress.value;
    return {
      borderColor: error
        ? colors.red
        : success
        ? colors.green
        : p > 0
        ? colors.ink
        : colors.hairline,
      borderWidth: 1 + p * 0.5,
    } as any;
  });

  const labelStyle = useAnimatedStyle(() => {
    const p = focusProgress.value;
    return {
      transform: [{ translateY: -2 - p * 2 }, { scale: 1 - p * 0.08 }],
      color: error ? colors.red : success ? colors.green : p > 0 ? colors.ink : colors.muted,
    } as any;
  });

  const sizeMap = {
    sm: { padding: 12, fontSize: 14.5, height: 44 },
    md: { padding: 14, fontSize: 15.5, height: 52 },
    lg: { padding: 16, fontSize: 16, height: 58 },
  } as const;
  const sz = sizeMap[size];

  return (
    <ShakeView trigger={shakeTrigger ?? 0} haptic={false} style={containerStyle}>
      {label && (
        <Animated.Text
          style={[
            typography.caption,
            {
              marginBottom: 8,
              fontWeight: '600',
              color: error ? colors.red : success ? colors.green : colors.muted,
            },
            labelStyle,
          ]}
        >
          {label}
          {required && <Text style={{ color: colors.red }}> *</Text>}
        </Animated.Text>
      )}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.sm,
            paddingHorizontal: sz.padding,
            minHeight: sz.height,
            gap: 10,
          },
          borderStyle,
          inputStyle,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={error ? colors.red : success ? colors.green : focused ? colors.ink : colors.muted}
          />
        )}
        <TextInput
          {...rest}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.faint}
          style={{
            flex: 1,
            fontSize: sz.fontSize,
            fontWeight: '500',
            color: colors.ink,
            paddingVertical: 0,
          }}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={10}>
            <Ionicons
              name={rightIcon}
              size={18}
              color={error ? colors.red : success ? colors.green : focused ? colors.ink : colors.muted}
            />
          </Pressable>
        )}
      </Animated.View>
      {(error || hint || helper) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            minHeight: 16,
          }}
        >
          {error ? (
            <>
              <Ionicons name="alert-circle" size={12} color={colors.red} />
              <Text style={[typography.caption, { color: colors.red, flex: 1 }]}>{error}</Text>
            </>
          ) : success ? (
            <>
              <Ionicons name="checkmark-circle" size={12} color={colors.green} />
              <Text style={[typography.caption, { color: colors.green, flex: 1 }]}>{helper}</Text>
            </>
          ) : hint ? (
            <Text style={[typography.caption, { color: colors.faint, flex: 1 }]}>{hint}</Text>
          ) : null}
        </View>
      )}
    </ShakeView>
  );
}

export default FormField;
