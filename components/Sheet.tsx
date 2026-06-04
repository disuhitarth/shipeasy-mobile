import React, { ReactNode, useEffect } from 'react';
import { Modal, ModalProps, Pressable, StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors, borderRadius } from '@/lib/theme';

const SPRING = { damping: 22, stiffness: 220, mass: 0.9 } as const;

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string | number;
  containerStyle?: StyleProp<ViewStyle>;
  closeOnOverlayPress?: boolean;
}

export function Sheet({
  visible,
  onClose,
  children,
  maxHeight = '90%',
  containerStyle,
  closeOnOverlayPress = true,
}: SheetProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      progress.value = withSpring(1, SPRING);
    }
  }, [visible, progress]);

  const close = () => {
    progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const sheetStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [{ translateY: (1 - p) * 600 }],
      opacity: p,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return { opacity: p * 0.42 };
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="none"
      onRequestClose={close}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeOnOverlayPress ? close : undefined}
        />
        <View style={styles.bottom} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              { maxHeight: maxHeight as any },
              sheetStyle,
              containerStyle,
            ]}
          >
            <View style={styles.grabber} />
            {children}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#000',
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(10,10,20,0.15)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
});

export default Sheet;
