import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BarChart, aggregateByDay, aggregateByWeek, aggregateByMonth, type ChartBar } from '@/lib/charts';
import { colors, borderRadius, spacing, shadows } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

type Range = 'week' | 'month' | 'year';

interface SpendingChartProps {
  transactions: { type: string; amount: number; createdAt: string }[];
  style?: StyleProp<ViewStyle>;
}

export function SpendingChart({ transactions, style }: SpendingChartProps) {
  const [range, setRange] = useState<Range>('month');

  const data: ChartBar[] = useMemo(() => {
    if (range === 'week') return aggregateByDay(transactions, 7);
    if (range === 'month') return aggregateByDay(transactions, 30);
    return aggregateByMonth(transactions, 6);
  }, [range, transactions]);

  const rangeLabel: Record<Range, string> = {
    week: 'Last 7 days',
    month: 'Last 30 days',
    year: 'Last 6 months',
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spending</Text>
          <Text style={styles.subtitle}>{rangeLabel[range]}</Text>
        </View>
        <View style={styles.seg}>
          {(['week', 'month', 'year'] as Range[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => {
                if (r !== range) {
                  Haptics.selection();
                  setRange(r);
                }
              }}
              style={[styles.segBtn, range === r && styles.segBtnActive]}
              hitSlop={4}
            >
              <Text style={[styles.segText, range === r && styles.segTextActive]}>
                {r === 'week' ? 'W' : r === 'month' ? 'M' : 'Y'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <BarChart data={data} height={150} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.faint,
    marginTop: 2,
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 9,
    padding: 2,
  },
  segBtn: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  segBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  segText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  segTextActive: {
    color: colors.ink,
  },
});
