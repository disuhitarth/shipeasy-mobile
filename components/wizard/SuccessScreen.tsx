import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/PressableScale';
import * as Haptics from '@/lib/haptics';
import { colors, shadows } from '@/lib/theme';

interface SuccessScreenProps {
  shipment: {
    id: string;
    price: number;
  };
  onDone: () => void;
  onTrack: () => void;
  onViewLabel: () => void;
}

export function SuccessScreen({ shipment, onDone, onTrack, onViewLabel }: SuccessScreenProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={ZoomIn.duration(560).springify().damping(14)} style={styles.ring}>
        <View style={styles.checkCircle}>
          <Animated.View entering={FadeInUp.duration(400).delay(220)}>
            <Ionicons name="checkmark" size={44} color="#1E9E6A" />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(360).delay(180)} style={styles.textBlock}>
        <Text style={styles.title}>Label purchased</Text>
        <Text style={styles.sub}>
          Your label is ready to print and your wallet was charged ${shipment.price.toFixed(2)}.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(360).delay(280)} style={styles.card}>
        <View style={styles.trackingRow}>
          <View>
            <Text style={styles.trackingLabel}>Tracking number</Text>
            <Text style={styles.trackingCode}>{shipment.id}</Text>
          </View>
          <PressableScale
            style={styles.copyBtn}
            onPress={() => Haptics.light()}
            haptic="light"
            scaleTo={0.88}
          >
            <Ionicons name="copy-outline" size={17} color="#0B0B12" />
          </PressableScale>
        </View>
        <View style={styles.dlRow}>
          <PressableScale style={styles.dlChip} onPress={onViewLabel} haptic="light">
            <Ionicons name="document-text" size={16} color={colors.accent} />
            <Text style={styles.dlText}>PDF label</Text>
          </PressableScale>
          <PressableScale style={styles.dlChip} onPress={onViewLabel} haptic="light">
            <Ionicons name="download" size={16} color={colors.accent} />
            <Text style={styles.dlText}>ZPL (4×6)</Text>
          </PressableScale>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(360).delay(380)} style={styles.actions}>
        <Button variant="primary" full onPress={onTrack} haptic="success">
          Track shipment
        </Button>
        <Button variant="ghost" full onPress={onDone} haptic="light">
          Back to home
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  ring: { alignItems: 'center', marginBottom: 22 },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(30,158,106,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', marginBottom: 26 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  sub: {
    fontSize: 15,
    color: '#6B6B76',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
  },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#9A9AA4',
  },
  trackingCode: { fontSize: 18, fontWeight: '700', marginTop: 4, color: '#0B0B12' },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  dlChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(10,10,20,0.07)',
    backgroundColor: '#F7F7F9',
  },
  dlText: { fontSize: 13.5, fontWeight: '600', color: '#0B0B12' },
  actions: { gap: 12 },
});
