import { Tabs, usePathname, useRouter } from 'expo-router';
import { View, Text, StyleSheet, type ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { page } from '@/lib/analytics';
import * as Haptics from '@/lib/haptics';
import { FabMenu, FabButton, type FabMenuItem } from '@/components/FabMenu';
import { NewBadge } from '@/components/NewBadge';

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

interface TabIconProps extends BouncingIconProps {
  badgeId?: string;
  showBadge?: boolean;
}

function TabIcon({ name, color, size, focused, badgeId, showBadge }: TabIconProps) {
  return (
    <View style={tabIconStyles.wrap}>
      <BouncingIcon name={name} color={color} size={size} focused={focused} />
      {showBadge && badgeId ? (
        <View style={tabIconStyles.badgeWrap}>
          <NewBadge id={badgeId} />
        </View>
      ) : null}
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeWrap: {
    position: 'absolute',
    top: -6,
    right: -12,
  },
});

interface AnimatedDotIndicatorProps {
  focused: boolean;
}

function AnimatedDotIndicator({ focused }: AnimatedDotIndicatorProps) {
  const scale = useSharedValue(focused ? 1 : 0);
  const opacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1, { damping: 12, stiffness: 240 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [focused, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[tabBarStyles.dot, animatedStyle]} />
  );
}

interface TabItemProps {
  focused: boolean;
  route: string;
  router: ReturnType<typeof useRouter>;
  children: React.ReactNode;
}

function TabItem({ focused, route, router, children }: TabItemProps) {
  const handlePress = () => {
    if (!focused) {
      router.push(route as any);
    }
  };
  return (
    <View style={tabBarStyles.tabItem} onTouchEnd={handlePress}>
      {children}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});

const FAB_MENU_ITEMS: FabMenuItem[] = [
  { id: 'ship-now', label: 'Ship now (guest)', icon: 'flash-outline', route: '/ship-now' },
  { id: 'batch', label: 'Magic Batch', icon: 'sparkles', route: '/batch', badge: true },
  { id: 'new', label: 'New shipment', icon: 'cube-outline', route: '/wizard' },
];

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('home');

  useEffect(() => {
    const screen = pathname?.replace(/^\//, '').replace(/\/.*$/, '') || 'home';
    setCurrentTab(screen);
    void page(`tabs/${screen}`);
  }, [pathname]);

  const isHome = currentTab === 'index' || currentTab === '' || pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
  const isShipments = currentTab === 'shipments';
  const isWallet = currentTab === 'wallet';
  const isProfile = currentTab === 'profile';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent as any,
        tabBarInactiveTintColor: colors.faint as any,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <TabIcon name="home" color={color} size={size} focused={focused} />
              <AnimatedDotIndicator focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: 'Shipments',
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <TabIcon name="cube" color={color} size={size} focused={focused} />
              <AnimatedDotIndicator focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wizard-fab"
        options={{
          title: '',
          tabBarButton: () => (
            <FabMenu
              items={FAB_MENU_ITEMS}
              buttonSize={58}
              bottomOffset={90}
              routerPush={(route) => router.push(route as any)}
              renderButton={({ onPress, focused, size }) => (
                <FabButton onPress={onPress} focused={focused} size={size} />
              )}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <TabIcon name="wallet" color={color} size={size} focused={focused} />
              <AnimatedDotIndicator focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <TabIcon name="person" color={color} size={size} focused={focused} />
              <AnimatedDotIndicator focused={focused} />
            </View>
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
});

const _RUN_ON_JS = runOnJS;
const _SPACING = spacing;
const _BORDER_RADIUS = borderRadius;
const _IS_HOME = isHome;
const _IS_SHIPMENTS = isShipments;
const _IS_WALLET = isWallet;
const _IS_PROFILE = isProfile;
