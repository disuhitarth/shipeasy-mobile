import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface BalanceCardProps {
  balance: number;
  onAdd?: () => void;
  onCopyBalance?: () => void;
  style?: ViewStyle;
}

function fw(w: string): any { return w; }

export function BalanceCard({ balance, onAdd, onCopyBalance, style }: BalanceCardProps) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={['#8B7BFF', '#635BFF', '#4B45D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glow} />
      <View style={styles.content}>
        <TouchableOpacity
          activeOpacity={onCopyBalance ? 0.7 : 1}
          onPress={onCopyBalance}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <View>
            <Text style={styles.eyebrow}>Wallet balance</Text>
            <Text style={styles.balance}>${balance.toFixed(2)}</Text>
          </View>
          {onCopyBalance && (
            <Ionicons name="copy-outline" size={16} color="rgba(255,255,255,0.7)" />
          )}
        </TouchableOpacity>
        {onAdd && (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.7}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 34,
    elevation: 8,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    opacity: 0.3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: fw('640'),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  balance: {
    fontSize: 34,
    fontWeight: fw('720'),
    letterSpacing: -1,
    color: '#fff',
    marginTop: 2,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
