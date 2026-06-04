import React, { useCallback, useEffect } from 'react';
import { View, Text, ViewStyle, StyleProp, Pressable, ActivityIndicator, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger' | 'gradient' | 'glass';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: 'light' | 'medium' | 'success' | 'warning' | 'error' | 'none';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  rounded?: keyof typeof borderRadius;
  gradient?: readonly [string, string];
}

const SIZE_MAP: Record<Size, { px: number; py: number; fontSize: number; height: number; iconSize: number; gap: number }> = {
  sm: { px: 14, py: 8, fontSize: 13.5, height: 36, iconSize: 14, gap: 6 },
  md: { px: 18, py: 12, fontSize: 15, height: 46, iconSize: 16, gap: 8 },
  lg: { px: 22, py: 14, fontSize: 16, height: 54, iconSize: 18, gap: 10 },
  xl: { px: 24, py: 16, fontSize: 17, height: 60, iconSize: 20, gap: 10 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = 'medium',
  style,
  textStyle,
  children,
  rounded = 'full',
  gradient = colors.purpleGrad,
}: ButtonProps) {
  const press = useSharedValue(0);
  const sz = SIZE_MAP[size];

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    press.value = withSpring(1, { damping: 12, stiffness: 380, mass: 0.5 });
  }, [disabled, loading, press]);

  const handlePressOut = useCallback(() => {
    press.value = withSpring(0, { damping: 14, stiffness: 280, mass: 0.6 });
  }, [press]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (haptic === 'light') Haptics.light();
    else if (haptic === 'medium') Haptics.medium();
    else if (haptic === 'success') Haptics.success();
    else if (haptic === 'warning') Haptics.warning();
    else if (haptic === 'error') Haptics.error();
    onPress?.();
  }, [disabled, loading, haptic, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = press.value;
    const scale = 1 - 0.04 * p;
    return {
      transform: [{ scale }],
    } as any;
  });

  const getBg = (): string => {
    if (variant === 'primary') return colors.accent;
    if (variant === 'dark') return colors.ink;
    if (variant === 'secondary') return colors.accentSoft;
    if (variant === 'ghost') return 'transparent';
    if (variant === 'danger') return colors.red;
    if (variant === 'glass') return 'rgba(255,255,255,0.18)';
    return colors.accent;
  };

  const getFg = (): string => {
    if (variant === 'primary' || variant === 'dark' || variant === 'danger') return colors.white;
    if (variant === 'secondary') return colors.accent;
    if (variant === 'ghost') return colors.accent;
    if (variant === 'glass') return colors.white;
    return colors.white;
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBg(),
    paddingHorizontal: sz.px,
    paddingVertical: sz.py,
    height: sz.height,
    borderRadius: borderRadius[rounded],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: sz.gap,
    ...(variant === 'primary' || variant === 'dark' || variant === 'danger' ? shadows.md : {}),
    ...(variant === 'glass' ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' } : {}),
    ...(variant === 'ghost' ? {} : {}),
    opacity: disabled ? 0.5 : 1,
  };

  const labelStyle: TextStyle = {
    color: getFg(),
    fontSize: sz.fontSize,
    fontWeight: '700',
    letterSpacing: -0.2,
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        { alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        animatedStyle,
        style,
      ]}
    >
      {variant === 'gradient' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: gradient[0],
            borderRadius: borderRadius[rounded],
          }}
        />
      )}
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={{
          flex: fullWidth ? 1 : undefined,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: sz.gap,
          paddingHorizontal: fullWidth ? sz.px : 0,
        }}
      >
        {loading ? (
          <ActivityIndicator color={getFg()} size="small" />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={sz.iconSize} color={getFg()} />}
            {children ?? (title && <Text style={[labelStyle, textStyle]}>{title}</Text>)}
            {iconRight && <Ionicons name={iconRight} size={sz.iconSize} color={getFg()} />}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: 'plain' | 'soft' | 'filled' | 'glass';
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  haptic?: 'light' | 'medium' | 'none';
  badge?: number | string;
}

export function IconButton({
  icon,
  onPress,
  variant = 'plain',
  size = 40,
  color,
  style,
  haptic = 'light',
  badge,
}: IconButtonProps) {
  const press = useSharedValue(0);

  const handlePressIn = () => {
    press.value = withSpring(1, { damping: 12, stiffness: 380, mass: 0.5 });
  };
  const handlePressOut = () => {
    press.value = withSpring(0, { damping: 14, stiffness: 280, mass: 0.6 });
  };
  const handlePress = () => {
    if (haptic === 'light') Haptics.light();
    else if (haptic === 'medium') Haptics.medium();
    onPress?.();
  };

  const animStyle = useAnimatedStyle(() => {
    const p = press.value;
    return { transform: [{ scale: 1 - 0.08 * p }] } as any;
  });

  const bg =
    variant === 'plain'
      ? 'transparent'
      : variant === 'soft'
      ? colors.surface2
      : variant === 'filled'
      ? colors.ink
      : 'rgba(255,255,255,0.18)';
  const iconColor = color ?? (variant === 'filled' || variant === 'glass' ? colors.white : colors.ink);

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          ...(variant === 'glass' ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' } : {}),
        }}
      >
        <Ionicons name={icon} size={size * 0.45} color={iconColor} />
        {badge != null && (
          <View
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              paddingHorizontal: 5,
              backgroundColor: colors.red,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.surface,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>
              {typeof badge === 'number' && badge > 9 ? '9+' : badge}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default Button;
