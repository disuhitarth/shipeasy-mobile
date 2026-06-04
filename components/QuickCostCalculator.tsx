import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuickQuote } from '@/lib/queries';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';
import { PressableScale } from './PressableScale';
import * as Haptics from '@/lib/haptics';

interface QuickCostCalculatorProps {
  style?: StyleProp<ViewStyle>;
}

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

export function QuickCostCalculator({ style }: QuickCostCalculatorProps) {
  const [fromPostal, setFromPostal] = useState('M5T2C9');
  const [toPostal, setToPostal] = useState('');
  const [toCountry, setToCountry] = useState('CA');
  const [weight, setWeight] = useState('1');
  const [packageType, setPackageType] = useState('parcel');
  const [result, setResult] = useState<number | null>(null);
  const quote = useQuickQuote();

  useEffect(() => {
    if (!toPostal || toPostal.length < 3) {
      setResult(null);
      return;
    }
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      setResult(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await quote.mutateAsync({
          toPostalCode: toPostal,
          toCountry,
          packageType,
        });
        setResult(res.startingFrom);
      } catch {
        setResult(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [toPostal, toCountry, weight, packageType, quote]);

  const onShip = () => {
    Haptics.success();
    router.push({
      pathname: '/wizard',
      params: {
        prefillWeight: weight || '1',
        prefillPostal: toPostal || '',
        prefillProvince: toCountry === 'CA' ? 'ON' : '',
      },
    } as any);
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="calculator" size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Quick cost calculator</Text>
          <Text style={styles.subtitle}>Estimate shipping in seconds</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>From</Text>
          <TextInput
            value={fromPostal}
            onChangeText={setFromPostal}
            style={styles.input}
            placeholder="M5T 2C9"
            placeholderTextColor={colors.faint}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>To</Text>
          <TextInput
            value={toPostal}
            onChangeText={(t) => setToPostal(t.toUpperCase())}
            style={styles.input}
            placeholder="V6Z 1R8"
            placeholderTextColor={colors.faint}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Weight (lb)</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={colors.faint}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Country</Text>
          <View style={styles.countryPillRow}>
            {(['CA', 'US'] as const).map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  Haptics.selection();
                  setToCountry(c);
                }}
                style={[styles.countryPill, toCountry === c && styles.countryPillActive]}
              >
                <Text style={[styles.countryPillText, toCountry === c && styles.countryPillTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.resultRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultLabel}>Starting from</Text>
          {quote.isPending ? (
            <Text style={styles.resultValue}>Calculating…</Text>
          ) : result != null ? (
            <Text style={styles.resultValue}>${result.toFixed(2)}</Text>
          ) : (
            <Text style={styles.resultHint}>Enter a postal code</Text>
          )}
        </View>
        <PressableScale
          style={[styles.shipBtn, !result && styles.shipBtnDisabled]}
          onPress={onShip}
          haptic="success"
          disabled={!result}
        >
          <Text style={styles.shipBtnText}>Ship with this rate</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </PressableScale>
      </View>
    </View>
  );
}

const _PROVINCES = PROVINCES;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: 12,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12,
    color: colors.faint,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    fontSize: 14,
    color: colors.ink,
    fontWeight: '600',
  },
  countryPillRow: {
    flexDirection: 'row',
    gap: 4,
  },
  countryPill: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryPillActive: {
    backgroundColor: colors.accent,
  },
  countryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  countryPillTextActive: {
    color: '#fff',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline2,
  },
  resultLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  resultHint: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  shipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  shipBtnDisabled: {
    opacity: 0.5,
  },
  shipBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fff',
  },
});
