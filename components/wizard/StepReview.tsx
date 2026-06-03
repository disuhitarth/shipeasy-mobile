import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WizardState } from './types';

const RATES = [
  { id: 'ECO', post: 9.85 },
  { id: 'TRK', post: 14.20 },
  { id: 'EXP', post: 18.94 },
  { id: 'PRI', post: 26.40 },
];

interface Props {
  state: WizardState;
  balance: number;
}

export function StepReview({ state, balance }: Props) {
  const rate = RATES.find((r) => r.id === state.rateId) || RATES[1];
  const hst = rate.post * 0.13;
  const total = rate.post * 1.13;
  const after = balance - total;
  const ok = after >= 0;

  const rateName = {
    ECO: 'Stallion Economy',
    TRK: 'Stallion Tracked',
    EXP: 'Stallion Express',
    PRI: 'Stallion Priority',
  }[state.rateId] || 'Stallion Tracked';

  const rateDays = {
    ECO: '5–8 business days',
    TRK: '3–5 business days',
    EXP: '2–3 business days',
    PRI: '1–2 business days',
  }[state.rateId] || '3–5 business days';

  return (
    <View style={styles.container}>
      {/* Rate Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.pkgIcon}>
            <Ionicons name="cube" size={24} color="#635BFF" />
          </View>
          <View>
            <Text style={styles.rateName}>{rateName}</Text>
            <Text style={styles.rateDays}>{rateDays}</Text>
          </View>
        </View>
        <View style={styles.route}>
          <View>
            <Text style={styles.routeLabel}>FROM</Text>
            <Text style={styles.routeCity}>Toronto, ON</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#9A9AA4" />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.routeLabel}>TO</Text>
            <Text style={styles.routeCity}>
              {state.toCity || 'Vancouver'}, {state.toProvince || 'BC'}
            </Text>
          </View>
        </View>
      </View>

      {/* Price Breakdown */}
      <View style={styles.priceCard}>
        {([
          ['Postage', rate.post],
          ['HST (13%)', hst],
        ] as [string, number][]).map(([label, value]) => (
          <View key={label} style={styles.priceRow}>
            <Text style={styles.priceLabel}>{label}</Text>
            <Text style={styles.priceValue}>${value.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Wallet Check */}
      <View style={[styles.walletCheck, ok && styles.walletOk]}>
        <View style={[styles.walletIcon, ok && styles.walletIconOk]}>
          <Ionicons
            name="wallet"
            size={18}
            color={ok ? '#1E9E6A' : '#C8860B'}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.walletTitle}>
            {ok ? 'Paid from wallet' : 'Insufficient balance'}
          </Text>
          <Text style={styles.walletSub}>
            {ok
              ? `Balance $${balance.toFixed(2)} → $${after.toFixed(2)}`
              : `Add $${(-after).toFixed(2)} to continue`}
          </Text>
        </View>
        {ok && (
          <Text style={styles.walletCheckmark}>✓</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
  },
  summaryRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  pkgIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECEBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateName: { fontSize: 16, fontWeight: '700' },
  rateDays: { fontSize: 13, color: '#9A9AA4', marginTop: 2 },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,10,20,0.07)',
  },
  routeLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#9A9AA4',
  },
  routeCity: { fontSize: 13.5, fontWeight: '600', marginTop: 2 },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: { fontSize: 14.5, color: '#6B6B76' },
  priceValue: { fontSize: 14.5, fontWeight: '600', color: '#0B0B12' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,10,20,0.07)',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0B0B12' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#0B0B12' },
  walletCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FBF0DA',
  },
  walletOk: { backgroundColor: '#E2F4EC' },
  walletIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(200,134,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIconOk: { backgroundColor: 'rgba(30,158,106,0.15)' },
  walletTitle: { fontSize: 14, fontWeight: '600', color: '#0B0B12' },
  walletSub: { fontSize: 12.5, color: '#9A9AA4', marginTop: 1 },
  walletCheckmark: { fontSize: 14, fontWeight: '700', color: '#1E9E6A' },
});
