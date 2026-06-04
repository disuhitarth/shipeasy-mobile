import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSKUs } from '@/lib/queries';
import type { SKU } from '@/types';
import { Sheet } from '@/components/Sheet';
import { PressableScale } from '@/components/PressableScale';
import { colors, borderRadius } from '@/lib/theme';
import * as Haptics from '@/lib/haptics';

interface SkuSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (sku: SKU) => void;
}

export function SkuSheet({ open, onClose, onPick }: SkuSheetProps) {
  const { data: skus } = useSKUs();

  return (
    <Sheet visible={open} onClose={onClose} maxHeight="80%">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>Quick add SKU</Text>
          <Text style={styles.sheetSub}>
            Auto-fills weight, dimensions & customs.
          </Text>
        </View>
        <PressableScale style={styles.closeBtn} onPress={onClose} haptic="light">
          <Ionicons name="close" size={16} color={colors.muted} />
        </PressableScale>
      </View>
      <ScrollView
        style={styles.skuList}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {(!skus || skus.length === 0) ? (
          <Text style={styles.empty}>No SKUs saved yet</Text>
        ) : (
          skus.filter(s => s.isActive).map((sku, i) => (
            <Animated.View
              key={sku._id}
              entering={FadeInDown.duration(320).delay(i * 50)}
            >
              <PressableScale
                style={styles.skuRow}
                onPress={() => {
                  Haptics.light();
                  onPick(sku);
                  onClose();
                }}
                haptic="light"
              >
                <View style={styles.skuAvatar}>
                  <Text style={styles.skuEmoji}>
                    {sku.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.skuInfo}>
                  <Text style={styles.skuName}>{sku.name}</Text>
                  <Text style={styles.skuMeta}>
                    {sku.sku} · {sku.defaultValue ? `$${sku.defaultValue}` : ''}
                  </Text>
                </View>
                <Text style={styles.skuValue}>
                  ${sku.defaultValue?.toFixed(2) || '—'}
                </Text>
              </PressableScale>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4, color: colors.ink },
  sheetSub: { fontSize: 13.5, color: colors.muted, marginTop: 2 },
  skuList: { flex: 1 },
  empty: { color: colors.faint, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 13,
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 10,
  },
  skuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skuEmoji: { fontSize: 20, color: colors.accent, fontWeight: '700' },
  skuInfo: { flex: 1 },
  skuName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  skuMeta: { fontSize: 12.5, color: colors.faint, marginTop: 2 },
  skuValue: { fontSize: 14, fontWeight: '700', color: colors.ink },
});
