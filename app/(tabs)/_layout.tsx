import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, type ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

interface BouncingIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  size: number;
  focused: boolean;
}

function BouncingIcon({ name, color, size, focused }: BouncingIconProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withTiming(1.22, { duration: 120 }),
        withSpring(1, { damping: 8, stiffness: 220 }),
      );
      translateY.value = withSequence(
        withTiming(-3, { duration: 120 }),
        withSpring(0, { damping: 10, stiffness: 220 }),
      );
      Haptics.light();
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 220 });
    }
  }, [focused, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color as string} />
    </Animated.View>
  );
}

interface FabButtonProps {
  focused: boolean;
}

function FabButton({ focused }: FabButtonProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 120 }),
        withSpring(1, { damping: 8, stiffness: 220 }),
      );
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    }
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.fabContainer}>
      <Animated.View style={[styles.fab, animatedStyle]}>
        <Ionicons name="add" size={28} color="#fff" />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent as any,
        tabBarInactiveTintColor: colors.faint as any,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <BouncingIcon name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: 'Shipments',
          tabBarIcon: ({ color, size, focused }) => (
            <BouncingIcon name="cube" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wizard-fab"
        options={{
          title: '',
          tabBarButton: () => <FabButton focused={false} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size, focused }) => (
            <BouncingIcon name="wallet" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <BouncingIcon name="person" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: 'Shipments',
          tabBarIcon: ({ color, size, focused }) => (
            <BouncingIcon name="cube" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wizard-fab"
        options={{
          title: '',
          tabBarButton: (props: any) => <FabButton focused={props.focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size, focused }) => (
            <BouncingIcon name="wallet" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <BouncingIcon name="person" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(242,242,245,0.92)',
    borderTopColor: 'rgba(10,10,20,0.07)',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 24,
    height: 88,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  fabContainer: {
    top: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
});
