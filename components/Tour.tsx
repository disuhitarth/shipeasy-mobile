import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, shadows, spacing } from '@/lib/theme';
import { LocalStore } from '@/lib/localStore';
import * as Haptics from '@/lib/haptics';

export interface TourStepDef {
  id: string;
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface RegisteredTarget {
  ref: React.RefObject<View | null>;
  rect: LayoutRectangle | null;
}

interface TourContextValue {
  registerTarget: (id: string, ref: React.RefObject<View | null>, rect: LayoutRectangle | null) => void;
  unregisterTarget: (id: string) => void;
  targets: Map<string, RegisteredTarget>;
  startTour: (steps: TourStepDef[]) => void;
  stopTour: () => void;
  isActive: boolean;
  currentStep: TourStepDef | null;
  currentIndex: number;
  totalSteps: number;
  next: () => void;
  back: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used inside TourProvider');
  }
  return ctx;
}

interface TourProviderProps {
  children: ReactNode;
  autoStartId?: string;
}

const PADDING = 8;
const RING_PADDING = 8;

export function TourProvider({ children, autoStartId }: TourProviderProps) {
  const [targets, setTargets] = useState<Map<string, RegisteredTarget>>(new Map());
  const [steps, setSteps] = useState<TourStepDef[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [active, setActive] = useState(false);

  const registerTarget = useCallback(
    (id: string, ref: React.RefObject<View | null>, rect: LayoutRectangle | null) => {
      setTargets((prev) => {
        const next = new Map(prev);
        next.set(id, { ref, rect });
        return next;
      });
    },
    [],
  );

  const unregisterTarget = useCallback((id: string) => {
    setTargets((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const startTour = useCallback((tourSteps: TourStepDef[]) => {
    if (tourSteps.length === 0) return;
    setSteps(tourSteps);
    setCurrentIndex(0);
    setActive(true);
  }, []);

  const stopTour = useCallback(() => {
    setActive(false);
    setSteps([]);
    setCurrentIndex(0);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => {
      if (i + 1 >= steps.length) {
        setActive(false);
        return 0;
      }
      return i + 1;
    });
  }, [steps.length]);

  const back = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!autoStartId) return;
    if (steps.length > 0 || active) return;
    let cancelled = false;
    (async () => {
      const seen = await LocalStore.getTourSeen(autoStartId);
      if (!cancelled && !seen) {
        // Auto-start is opt-in for screens; they must register and call startTour
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoStartId, active, steps.length]);

  const currentStep = active && steps[currentIndex] ? steps[currentIndex] : null;
  const target = currentStep ? targets.get(currentStep.id) : null;

  const value = useMemo<TourContextValue>(
    () => ({
      registerTarget,
      unregisterTarget,
      targets,
      startTour,
      stopTour,
      isActive: active,
      currentStep,
      currentIndex,
      totalSteps: steps.length,
      next,
      back,
    }),
    [registerTarget, unregisterTarget, targets, startTour, stopTour, active, currentStep, currentIndex, steps.length, next, back],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && currentStep ? (
        <TourOverlay
          step={currentStep}
          target={target}
          index={currentIndex}
          total={steps.length}
          onNext={next}
          onBack={back}
          onClose={stopTour}
        />
      ) : null}
    </TourContext.Provider>
  );
}

interface TourStepProps {
  id: string;
  tourId?: string;
  active?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  measureTrigger?: unknown;
  padding?: number;
}

export function TourTarget({
  id,
  active = true,
  children,
  style,
  measureTrigger,
  padding = 0,
}: TourStepProps) {
  const ref = useRef<View>(null);
  const { registerTarget, unregisterTarget, isActive } = useTour();
  const thisStepActive = isActive && active;

  const measure = useCallback(() => {
    if (!ref.current) return;
    const node = ref.current;
    try {
      node.measureInWindow((x, y, width, height) => {
        if (Number.isFinite(x) && Number.isFinite(y)) {
          registerTarget(
            id,
            ref,
            {
              x: x - padding,
              y: y - padding,
              width: width + padding * 2,
              height: height + padding * 2,
            },
          );
        }
      });
    } catch {}
  }, [id, padding, registerTarget]);

  useEffect(() => {
    if (!thisStepActive) return;
    const t = setTimeout(measure, 60);
    return () => clearTimeout(t);
  }, [thisStepActive, measure, measureTrigger]);

  useEffect(() => {
    return () => unregisterTarget(id);
  }, [id, unregisterTarget]);

  return (
    <View ref={ref} collapsable={false} style={style} onLayout={thisStepActive ? measure : undefined}>
      {children}
    </View>
  );
}

interface TourOverlayProps {
  step: TourStepDef;
  target: RegisteredTarget | undefined;
  index: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

function TourOverlay({ step, target, index, total, onNext, onBack, onClose }: TourOverlayProps) {
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    Haptics.light();
  }, [step.id]);

  useEffect(() => {
    if (target?.rect) {
      setLayout({ width: target.rect.width, height: target.rect.height });
    }
  }, [target?.rect]);

  const ringProgress = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    ringProgress.value = 0;
    ringProgress.value = withDelay(40, withSpring(1, { damping: 16, stiffness: 200 }));
    pulse.value = 0;
    pulse.value = withDelay(
      120,
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) }),
      ),
    );
  }, [step.id, ringProgress, pulse]);

  useEffect(() => {
    if (target) return;
    const t = setTimeout(() => {
      if (!target) onNext();
    }, 4500);
    return () => clearTimeout(t);
  }, [target, onNext]);

  const onFinish = useCallback(() => {
    void LocalStore.markTourSeen(step.id);
    onClose();
  }, [step.id, onClose]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: ringProgress.value,
    transform: [
      { translateY: (1 - ringProgress.value) * 12 },
      { scale: 0.96 + ringProgress.value * 0.04 },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => {
    const t = target?.rect;
    if (!t) {
      return { opacity: 0 };
    }
    const x = t.x - RING_PADDING;
    const y = t.y - RING_PADDING;
    const w = t.width + RING_PADDING * 2;
    const h = t.height + RING_PADDING * 2;
    return {
      position: 'absolute' as const,
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 18,
      borderWidth: 2.5,
      borderColor: 'rgba(255,255,255,0.95)',
      opacity: ringProgress.value,
      transform: [{ scale: 1 + pulse.value * 0.04 }],
    };
  });

  const cutoutStyle = useAnimatedStyle(() => {
    const t = target?.rect;
    if (!t) return { opacity: 0 };
    const x = t.x - RING_PADDING - 4;
    const y = t.y - RING_PADDING - 4;
    return {
      position: 'absolute' as const,
      left: x,
      top: y,
      width: t.width + RING_PADDING * 2 + 8,
      height: t.height + RING_PADDING * 2 + 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(99,91,255,0.6)',
      opacity: ringProgress.value,
    };
  });

  const isLast = index === total - 1;
  const cardTop = target?.rect
    ? Math.min(
        Math.max(target.rect.y + target.rect.height + 18, insets.top + 80),
        (target.rect.y > 320 ? target.rect.y - 160 : target.rect.y + target.rect.height + 18),
      )
    : insets.top + 80;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onFinish} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill} pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={onFinish}>
          <View style={styles.scrim} />
        </Pressable>

        {target?.rect ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={cutoutStyle} />
            <Animated.View style={ringStyle} />
          </View>
        ) : null}

        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.cardWrap,
            { top: cardTop, paddingBottom: insets.bottom + 20 },
            cardStyle,
          ]}
        >
          <View style={styles.card}>
            {step.icon ? (
              <View style={styles.iconWrap}>
                <Ionicons name={step.icon} size={18} color={colors.accent} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{step.title}</Text>
                <Text style={styles.cardCounter}>
                  {index + 1}/{total}
                </Text>
              </View>
              <Text style={styles.cardDesc}>{step.description}</Text>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.skipBtn}
                  onPress={onFinish}
                  hitSlop={8}
                >
                  <Text style={styles.skipText}>Skip</Text>
                </Pressable>
                <View style={styles.rightActions}>
                  {index > 0 ? (
                    <Pressable
                      style={styles.backBtn}
                      onPress={onBack}
                      hitSlop={8}
                    >
                      <Ionicons name="chevron-back" size={16} color={colors.muted} />
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.nextBtn} onPress={onNext}>
                    <Text style={styles.nextText}>{isLast ? 'Done' : 'Next'}</Text>
                    <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,18,0.72)',
  },
  cardWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 22,
    ...shadows.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    flex: 1,
  },
  cardCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.faint,
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 13.5,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 19,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.muted,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
  },
  nextText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fff',
  },
});

const _PADDING = PADDING;
const _RUN_ON_JS = runOnJS;
void Platform;
