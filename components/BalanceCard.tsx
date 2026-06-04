import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  interpolateColor,
  Extrapolation,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';

interface BalanceCardProps {
  balance: number;
  role?: string;
  onPress?: () => void;
  onTopUp?: () => void;
  recentChange?: { amount: number; type: 'add' | 'deduct' } | null;
  changeTrigger?: number;
  scrollY?: Animated.SharedValue<number>;
  cardHeight?: number;
  showActions?: boolean;
}

const SCREEN_W = Dimensions.get('window').width;

export function BalanceCard({
  balance,
  role,
  onPress,
  onTopUp,
  recentChange,
  changeTrigger = 0,
  scrollY,
  cardHeight = 200,
  showActions = true,
}: BalanceCardProps) {
  const tilt = useSharedValue({ x: 0, y: 0 });
  const shine = useSharedValue(0);
  const burst = useSharedValue(0);

  useEffect(() => {
    shine.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 0 }),
        withDelay(800, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [shine]);

  useEffect(() => {
    if (changeTrigger === 0) return;
    Haptics.success();
    burst.value = 0;
    burst.value = withSequence(
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) burst.value = withTiming(0, { duration: 200 });
      }),
    );
  }, [changeTrigger, burst]);

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .failOffsetY([-25, 25])
    .onUpdate((e) => {
      tilt.value = {
        x: Math.max(-1, Math.min(1, e.translationX / 80)),
        y: Math.max(-1, Math.min(1, e.translationY / 80)),
      };
    })
    .onEnd(() => {
      tilt.value = withSpring({ x: 0, y: 0 }, { damping: 14, stiffness: 200, mass: 0.7 });
    });

  const containerStyle = useAnimatedStyle(() => {
    const t = tilt.value;
    const rotateY = t.x * 6;
    const rotateX = -t.y * 6;
    let scale = 1;
    if (scrollY) {
      const sy = scrollY.value;
      scale = interpolate(sy, [-100, 0, cardHeight], [1.05, 1, 0.94], Extrapolation.CLAMP);
    }
    return {
      transform: [
        { perspective: 800 },
        { rotateX: `${rotateX}deg` },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
    } as any;
  });

  const shineStyle = useAnimatedStyle(() => {
    const t = shine.value;
    return {
      transform: [{ translateX: -200 + 600 * t }, { rotate: '20deg' }],
      opacity: 0.3 * t,
    } as any;
  });

  const burstStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + burst.value * 1.4 }],
      opacity: 1 - burst.value,
    } as any;
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            marginHorizontal: spacing['2xl'],
            borderRadius: borderRadius.lg,
            height: cardHeight,
            overflow: 'hidden',
            ...shadows.lg,
          },
          containerStyle,
        ]}
      >
        <LinearGradient
          colors={['#1B1B33', '#2C2A6B', '#3D3AA0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, padding: spacing['2xl'], justifyContent: 'space-between' }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: colors.accent,
              opacity: 0.18,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: -100,
              left: -40,
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: '#EC4899',
              opacity: 0.1,
            }}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: -50,
                left: 0,
                width: 80,
                height: 300,
                backgroundColor: 'rgba(255,255,255,0.5)',
              },
              shineStyle,
            ]}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={[typography.eyebrow, { color: 'rgba(255,255,255,0.6)', marginBottom: 4 }]}>
                {role ? `${role.toUpperCase()} BALANCE` : 'WALLET BALANCE'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#4ADE80',
                  }}
                />
                <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>
                  Live · Stallion Express
                </Text>
              </View>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <Ionicons name="wallet" size={16} color={colors.white} />
            </View>
          </View>

          <View style={{ alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>$</Text>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: '700',
                  color: colors.white,
                  letterSpacing: -1.5,
                  marginLeft: 4,
                }}
              >
                <NumberDisplay value={balance} trigger={changeTrigger} />
              </Text>
            </View>
            {recentChange && (
              <Animated.View
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: recentChange.type === 'add' ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)',
                  },
                  burstStyle,
                ]}
              >
                <Ionicons
                  name={recentChange.type === 'add' ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={recentChange.type === 'add' ? '#86EFAC' : '#FCA5A5'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: recentChange.type === 'add' ? '#86EFAC' : '#FCA5A5',
                  }}
                >
                  {recentChange.type === 'add' ? '+' : '-'}${Math.abs(recentChange.amount).toFixed(2)}
                </Text>
              </Animated.View>
            )}
          </View>

          {showActions && (
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <PressableScale
                onPress={onTopUp}
                haptic="medium"
                style={({ pressed: _ }: any) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.white,
                })}
              >
                <Ionicons name="add" size={16} color={colors.ink} />
                <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>Top up</Text>
              </PressableScale>
              <PressableScale
                onPress={onPress}
                haptic="light"
                style={({
                  pressed: _,
                }: any) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                })}
              >
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </PressableScale>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

function NumberDisplay({ value, trigger }: { value: number; trigger: number }) {
  return (
    <Text style={{ color: colors.white }}>
      <AnimatedNumber
        value={value}
        duration={700}
        decimals={2}
        style={{ color: colors.white, fontSize: 48, fontWeight: '700', letterSpacing: -1.5 }}
      />
    </Text>
  );
}

interface QuickStatsWidgetProps {
  stats: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[];
  style?: StyleProp<ViewStyle>;
}

export function QuickStatsWidget({ stats, style }: QuickStatsWidgetProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: spacing.sm,
          marginHorizontal: spacing['2xl'],
          marginTop: spacing.lg,
        },
        style,
      ]}
    >
      {stats.map((s, i) => (
        <StatCard key={i} {...s} delay={i * 60} />
      ))}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  delay?: number;
}

function StatCard({ label, value, icon, color, bg, delay = 0 }: StatCardProps) {
  return (
    <Animated.View
      entering={undefined as any}
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        gap: 6,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.ink,
          letterSpacing: -0.4,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={[typography.caption, { color: colors.muted, fontSize: 11 }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

export default BalanceCard;
