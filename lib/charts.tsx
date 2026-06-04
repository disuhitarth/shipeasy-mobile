import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';

export interface ChartBar {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartBar[];
  height?: number;
  showLabels?: boolean;
  showAxis?: boolean;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  height = 180,
  showLabels = true,
  showAxis = true,
  formatValue,
}: BarChartProps) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const fmt = formatValue || ((v: number) => `$${v.toFixed(0)}`);

  const plotHeight = showLabels ? height - 28 : height - 8;

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      {total > 0 ? (
        <View style={styles.totalPill}>
          <Text style={styles.totalPillText}>Total {fmt(total)}</Text>
        </View>
      ) : null}
      <View style={styles.plotArea}>
        {showAxis ? (
          <View style={styles.axisLabels}>
            <Text style={styles.axisText}>{fmt(max)}</Text>
            <Text style={styles.axisText}>{fmt(max / 2)}</Text>
            <Text style={styles.axisText}>{fmt(0)}</Text>
          </View>
        ) : null}
        <View style={styles.barsArea}>
          {showAxis ? (
            <View style={styles.gridLines} pointerEvents="none">
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
            </View>
          ) : null}
          <View style={styles.bars}>
            {data.map((d, i) => {
              const h = Math.max(0, (d.value / max) * (plotHeight - 4));
              return (
                <View key={i} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: h,
                        backgroundColor: d.value === 0 ? colors.hairline : colors.accent,
                        opacity: d.value === 0 ? 0.5 : 1,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>
      {showLabels ? (
        <View style={styles.xLabels}>
          {data.map((d, i) => (
            <Text key={i} style={styles.xLabel} numberOfLines={1}>
              {d.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function aggregateByDay(
  transactions: { type: string; amount: number; createdAt: string }[],
  days = 14,
): ChartBar[] {
  const now = Date.now();
  const buckets: ChartBar[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const label = days > 14 ? `${month}/${day}` : `${day}`;
    buckets.push({ label, value: 0 });
  }
  const start = now - days * 86_400_000;
  for (const tx of transactions) {
    if (tx.type !== 'shipment_charge') continue;
    const t = new Date(tx.createdAt).getTime();
    if (t < start) continue;
    const daysAgo = Math.floor((now - t) / 86_400_000);
    const idx = days - 1 - daysAgo;
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].value += Math.abs(tx.amount);
    }
  }
  return buckets;
}

export function aggregateByWeek(
  transactions: { type: string; amount: number; createdAt: string }[],
  weeks = 8,
): ChartBar[] {
  const now = Date.now();
  const buckets: { start: number; end: number; label: string; value: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = now - i * 7 * 86_400_000;
    const start = end - 7 * 86_400_000;
    buckets.push({ start, end, label: `W${weeks - i}`, value: 0 });
  }
  for (const tx of transactions) {
    if (tx.type !== 'shipment_charge') continue;
    const t = new Date(tx.createdAt).getTime();
    for (const b of buckets) {
      if (t >= b.start && t < b.end) {
        b.value += Math.abs(tx.amount);
        break;
      }
    }
  }
  return buckets.map((b) => ({ label: b.label, value: b.value }));
}

export function aggregateByMonth(
  transactions: { type: string; amount: number; createdAt: string }[],
  months = 6,
): ChartBar[] {
  const now = new Date();
  const buckets: { year: number; month: number; label: string; value: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ year: d.getFullYear(), month: d.getMonth(), label: monthNames[d.getMonth()], value: 0 });
  }
  for (const tx of transactions) {
    if (tx.type !== 'shipment_charge') continue;
    const d = new Date(tx.createdAt);
    const b = buckets.find((x) => x.year === d.getFullYear() && x.month === d.getMonth());
    if (b) b.value += Math.abs(tx.amount);
  }
  return buckets.map((b) => ({ label: b.label, value: b.value }));
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderRadius: borderRadius.md,
  },
  emptyText: {
    fontSize: 13,
    color: colors.faint,
    fontWeight: '500',
  },
  totalPill: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 2,
    ...shadows.sm,
  },
  totalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  plotArea: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 8,
  },
  axisLabels: {
    width: 38,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  axisText: {
    fontSize: 10,
    color: colors.faint,
    fontWeight: '600',
    textAlign: 'right',
    paddingRight: 4,
  },
  barsArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.hairline2,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  bar: {
    width: '70%',
    minHeight: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  xLabels: {
    flexDirection: 'row',
    height: 18,
    marginLeft: 38,
    paddingHorizontal: 2,
  },
  xLabel: {
    flex: 1,
    fontSize: 9.5,
    color: colors.faint,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const _SPACING = spacing;
