import React, { useCallback } from 'react';
import { View, ViewStyle, StyleProp, Text, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  deleteLabel?: string;
  archiveLabel?: string;
  deleteColor?: string;
  archiveColor?: string;
  deleteIcon?: keyof typeof Ionicons.glyphMap;
  archiveIcon?: keyof typeof Ionicons.glyphMap;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const ACTION_WIDTH = 88;
const MAX_TRANSLATE = -(ACTION_WIDTH * 2 + 8);

export function SwipeableRow({
  children,
  onDelete,
  onArchive,
  deleteLabel = 'Delete',
  archiveLabel = 'Archive',
  deleteColor = colors.red,
  archiveColor = colors.amber,
  deleteIcon = 'trash',
  archiveIcon = 'archive',
  enabled = true,
  style,
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 200, mass: 0.8 });
  }, [translateX]);

  const triggerDelete = useCallback(() => {
    Haptics.error();
    Alert.alert(
      'Are you sure?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: resetPosition },
        {
          text: deleteLabel,
          style: 'destructive',
          onPress: () => {
            translateX.value = withTiming(-Dimensions.get('window').width, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
              if (finished && onDelete) runOnJS(onDelete)();
            });
          },
        },
      ],
    );
  }, [deleteLabel, onDelete, resetPosition, translateX]);

  const triggerArchive = useCallback(() => {
    Haptics.warning();
    onArchive?.();
    resetPosition();
  }, [onArchive, resetPosition]);

  const panGesture = Gesture.Pan()
    .enabled(enabled && (!!onDelete || !!onArchive))
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = Math.max(MAX_TRANSLATE, Math.min(0, startX.value + e.translationX));
      translateX.value = next;
    })
    .onEnd((e) => {
      const finalX = translateX.value;
      const velocity = e.velocityX;
      if (finalX < MAX_TRANSLATE / 2 || velocity < -800) {
        Haptics.medium();
        translateX.value = withSpring(MAX_TRANSLATE, { damping: 18, stiffness: 220, mass: 0.7 });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.7 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteActionStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [-ACTION_WIDTH, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + 0.2 * progress }],
    } as any;
  });

  const archiveActionStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [MAX_TRANSLATE, -ACTION_WIDTH],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + 0.2 * progress }],
    } as any;
  });

  return (
    <View style={[{ position: 'relative' }, style]}>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'stretch',
          paddingRight: spacing.sm,
          gap: 4,
        }}
      >
        {onArchive && (
          <Animated.View
            style={[
              {
                width: ACTION_WIDTH,
                backgroundColor: archiveColor,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 4,
              },
              archiveActionStyle,
            ]}
          >
            <Ionicons name={archiveIcon} size={20} color={colors.white} />
            <Text style={[typography.caption, { color: colors.white, fontWeight: '600', marginTop: 4 }]}>{archiveLabel}</Text>
          </Animated.View>
        )}
        {onDelete && (
          <Animated.View
            style={[
              {
                width: ACTION_WIDTH,
                backgroundColor: deleteColor,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 4,
              },
              deleteActionStyle,
            ]}
          >
            <Ionicons name={deleteIcon} size={20} color={colors.white} />
            <Text style={[typography.caption, { color: colors.white, fontWeight: '600', marginTop: 4 }]}>{deleteLabel}</Text>
          </Animated.View>
        )}
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

export default SwipeableRow;
