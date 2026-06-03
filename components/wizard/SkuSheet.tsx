import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSKUs } from '@/lib/queries';
import type { SKU } from '@/types';
import { useState } from 'react';

interface SkuSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (sku: SKU) => void;
}

export function SkuSheet({ open, onClose, onPick }: SkuSheetProps) {
  const { data: skus } = useSKUs();
  if (!open) return null;

  return (
    <Modal transparent animationType="slide" visible={open} onRequestClose={onClose}>
      <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.grab} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Quick add SKU</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={16} color="#6B6B76" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetSub}>
            Auto-fills weight, dimensions & customs.
          </Text>
          <ScrollView style={styles.skuList}>
            {(!skus || skus.length === 0) ? (
              <Text style={styles.empty}>No SKUs saved yet</Text>
            ) : (
              skus.filter(s => s.isActive).map((sku) => (
                <TouchableOpacity
                  key={sku._id}
                  style={styles.skuRow}
                  onPress={() => { onPick(sku); onClose(); }}
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
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(8,8,16,0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F2F2F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 12,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  grab: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(10,10,20,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  sheetTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  sheetSub: { fontSize: 13.5, color: '#6B6B76', marginBottom: 14, paddingHorizontal: 8 },
  skuList: { gap: 10 },
  empty: { color: '#9A9AA4', fontSize: 14, textAlign: 'center', paddingVertical: 40 },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 13,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
  },
  skuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#ECEBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skuEmoji: { fontSize: 20, color: '#635BFF', fontWeight: '700' },
  skuInfo: { flex: 1 },
  skuName: { fontSize: 15, fontWeight: '600' },
  skuMeta: { fontSize: 12.5, color: '#9A9AA4', marginTop: 2 },
  skuValue: { fontSize: 14, fontWeight: '700', color: '#0B0B12' },
});
