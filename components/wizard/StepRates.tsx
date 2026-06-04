import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGetRates } from '@/lib/queries';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { PressableCard } from '@/components/PressableScale';
import { useEffect } from 'react';
import type { WizardState } from './types';
import * as Haptics from '@/lib/haptics';

const RATE_ICONS = ['cube', 'location', 'car', 'shield'] as const;
const RATES = [
  { id: 'ECO', name: 'Stallion Economy', svc: 'No tracking', days: '5–8 business days' },
  { id: 'TRK', name: 'Stallion Tracked', svc: 'Full tracking', days: '3–5 business days', badge: 'Popular' },
  { id: 'EXP', name: 'Stallion Express', svc: 'Tracked · Priority', days: '2–3 business days', badge: 'Fastest' },
  { id: 'PRI', name: 'Stallion Priority', svc: 'Tracked · Insured', days: '1–2 business days' },
];

interface Props {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
  rates: { rates: { id: string; totalPrice: number }[] } | null;
  isLoading: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function StepRates({ state, set, rates, isLoading, error, onRetry }: Props) {
  if (isLoading || (!rates && !error)) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#635BFF" />
          <Text style={styles.loadingText}>Fetching live rates from Stallion…</Text>
        </View>
        {[0, 1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.duration(360).delay(80 + i * 60)}
            style={styles.skelCard}
          >
            <View style={styles.skelIcon} />
            <View style={{ flex: 1 }}>
              <View style={styles.skelLine1} />
              <View style={styles.skelLine2} />
            </View>
            <View style={styles.skelPrice} />
          </Animated.View>
        ))}
      </View>
    );
  }

  if (error || !rates) {
    return (
      <Animated.View entering={FadeInDown.duration(360)} style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={40} color="#9A9AA4" />
        <Text style={styles.errorTitle}>Failed to fetch rates</Text>
        <Text style={styles.errorSub}>
          We couldn't get shipping rates for this address. Check your connection and try again.
        </Text>
        {onRetry && (
          <PressableCard style={styles.retryBtn} onPress={onRetry} haptic="medium">
            <Text style={styles.retryText}>Retry</Text>
          </PressableCard>
        )}
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      {rates.rates.map((rate, i) => {
        const r = RATES[i] || RATES[0];
        const sel = state.rateId === rate.id;
        return (
          <Animated.View
            key={rate.id}
            entering={FadeInDown.duration(380).delay(i * 70)}
            layout={LinearTransition.springify().damping(20).stiffness(220)}
          >
            <PressableCard
              style={[styles.rateCard, sel && styles.rateCardSel]}
              onPress={() => {
                Haptics.light();
                set({ rateId: rate.id });
              }}
              haptic="light"
            >
              <View style={[styles.rateIcon, sel && styles.rateIconSel]}>
                <Ionicons
                  name={RATE_ICONS[i] || 'cube'}
                  size={20}
                  color={sel ? '#fff' : '#635BFF'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rateNameRow}>
                  <Text style={styles.rateName}>{r.name}</Text>
                  {r.badge && (
                    <Text style={[styles.rateBadge, r.badge === 'Fastest' && styles.rateBadgeHot]}>
                      {r.badge}
                    </Text>
                  )}
                </View>
                <Text style={styles.rateMeta}>{r.days} · {r.svc}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ratePrice}>${rate.totalPrice.toFixed(2)}</Text>
                <Text style={styles.rateTax}>incl. HST</Text>
              </View>
            </PressableCard>
          </Animated.View>
        );
      })}
      <Animated.View entering={FadeInDown.duration(360).delay(280)} style={styles.hintRow}>
        <Ionicons name="information-circle" size={15} color="#9A9AA4" />
        <Text style={styles.hintText}>
          Prices include carrier postage and 13% HST.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  loadingContainer: { gap: 12 },
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#0B0B12', marginTop: 8 },
  errorSub: { fontSize: 14, color: '#6B6B76', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  retryBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 28, backgroundColor: '#635BFF', borderRadius: 10, alignItems: 'center' },
  retryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  loadingText: { fontSize: 14, fontWeight: '600', color: '#6B6B76' },
  skelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  skelIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F7F7F9',
  },
  skelLine1: {
    height: 14,
    width: '55%',
    backgroundColor: '#F7F7F9',
    borderRadius: 7,
    marginBottom: 8,
  },
  skelLine2: {
    height: 11,
    width: '38%',
    backgroundColor: '#F7F7F9',
    borderRadius: 6,
  },
  skelPrice: {
    width: 54,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#F7F7F9',
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rateCardSel: { borderColor: '#635BFF' },
  rateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECEBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateIconSel: { backgroundColor: '#635BFF' },
  rateNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rateName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  rateBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E2F4EC',
    color: '#1E9E6A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rateBadgeHot: { backgroundColor: '#ECEBFF', color: '#635BFF' },
  rateMeta: { fontSize: 12.5, color: '#9A9AA4', marginTop: 3 },
  ratePrice: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  rateTax: { fontSize: 11, color: '#9A9AA4', marginTop: 1 },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    backgroundColor: '#F7F7F9',
    borderRadius: 14,
  },
  hintText: { fontSize: 12.5, color: '#6B6B76', flex: 1, lineHeight: 18 },
});
