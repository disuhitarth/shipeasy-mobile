import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows, spacing } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

export interface FabMenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  onPress?: () => void;
  color?: string;
  bg?: string;
  badge?: boolean;
}

interface FabMenuProps {
  items: FabMenuItem[];
  buttonSize?: number;
  bottomOffset?: number;
  renderButton: (props: { onPress: () => void; focused: boolean; size: number }) => React.ReactNode;
  routerPush: (route: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function FabMenu({
  items,
  buttonSize = 58,
  bottomOffset = 90,
  renderButton,
  routerPush,
  style,
}: FabMenuProps) {
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (open) {
      progress.value = withSpring(1, { damping: 18, stiffness: 220 });
      rotation.value = withTiming(45, { duration: 240, easing: Easing.out(Easing.cubic) });
      Haptics.medium();
    } else {
      progress.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
      rotation.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
    }
  }, [open, progress, rotation]);

  const close = () => setOpen(false);

  const handlePick = (item: FabMenuItem) => {
    Haptics.light();
    setOpen(false);
    setTimeout(() => {
      if (item.onPress) item.onPress();
      else routerPush(item.route);
    }, 80);
  };

  const sortedItems = [...items].reverse();

  return (
    <>
      {renderButton({
        onPress: () => setOpen((o) => !o),
        focused: open,
        size: buttonSize,
      })}
      <Modal transparent visible={open} animationType="none" onRequestClose={close} statusBarTranslucent>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={close}>
            <AnimatedOverlay progress={progress} />
          </Pressable>

          <View
            pointerEvents="box-none"
            style={[styles.actionList, { bottom: bottomOffset, right: spacing.lg }]}
          >
            {sortedItems.map((item, i) => {
              const isPrimary = i === sortedItems.length - 1;
              return (
                <FabAction
                  key={item.id}
                  item={item}
                  index={i}
                  total={sortedItems.length}
                  progress={progress}
                  primary={isPrimary}
                  onPress={() => handlePick(item)}
                  bottomOffset={bottomOffset}
                />
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

function AnimatedOverlay({ progress }: { progress: Animated.SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.55,
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, animatedStyle]} />;
}

interface FabActionProps {
  item: FabMenuItem;
  index: number;
  total: number;
  progress: Animated.SharedValue<number>;
  primary: boolean;
  bottomOffset: number;
  onPress: () => void;
}

function FabAction({ item, index, total, progress, primary, onPress }: FabActionProps) {
  const distance = 70 + index * 62;
  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p,
      transform: [
        { translateY: (1 - p) * distance },
        { scale: 0.4 + p * 0.6 },
      ],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p,
      transform: [{ translateX: (1 - p) * 12 }],
    };
  });

  return (
    <Animated.View
      style={[styles.actionRow, animatedStyle]}
    >
      <Animated.View style={[styles.labelChip, labelStyle]}>
        <Text style={styles.labelText}>{item.label}</Text>
      </Animated.View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          primary && styles.actionButtonPrimary,
          {
            backgroundColor: item.bg || (primary ? colors.accent : colors.surface),
          },
          pressed && { transform: [{ scale: 0.92 }] },
        ]}
        hitSlop={6}
      >
        <Ionicons
          name={item.icon}
          size={primary ? 22 : 20}
          color={primary ? '#fff' : (item.color || colors.ink)}
        />
        {item.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

interface FabButtonProps {
  onPress: () => void;
  focused: boolean;
  size: number;
  primaryColor?: string;
}

export function FabButton({ onPress, focused, size, primaryColor = colors.accent }: FabButtonProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.08, { damping: 8, stiffness: 220 });
      rotation.value = withTiming(45, { duration: 220 });
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      rotation.value = withTiming(0, { duration: 220 });
    }
  }, [focused, scale, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.fabContainer}>
      <Pressable onPress={onPress} hitSlop={6}>
        <Animated.View
          style={[
            styles.fab,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: primaryColor },
            animatedStyle,
          ]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  actionList: {
    position: 'absolute',
    alignItems: 'flex-end',
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  actionButtonPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  labelChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    ...shadows.sm,
  },
  labelText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.ink,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.amber,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
});

const _BORDER_RADIUS = borderRadius;
