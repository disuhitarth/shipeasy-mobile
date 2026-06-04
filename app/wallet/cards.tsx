import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { colors, borderRadius, spacing, shadows } from '@/lib/theme';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/lib/toast';

interface Card {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'unknown';
  last4: string;
  exp: string;
  isDefault: boolean;
}

const BRAND_GRADIENT: Record<Card['brand'], [string, string]> = {
  visa: ['#1A1F71', '#3949AB'],
  mastercard: ['#161616', '#424242'],
  amex: ['#006FCF', '#012169'],
  unknown: ['#37474F', '#263238'],
};

function formatBrand(brand: Card['brand']) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const [loading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);

  const onAddCard = () => {
    Alert.alert(
      'Add a card',
      'Cards are added securely through Stripe when you top up your wallet. Continue to wallet top-up?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Top up', onPress: () => router.push('/wallet/topup') },
      ],
    );
  };

  const setDefault = (id: string) => {
    setDefaultId(id);
    setCards((cs) => cs.map((c) => ({ ...c, isDefault: c.id === id })));
    toast.success('Default card updated');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment methods</Text>
        <TouchableOpacity style={styles.navBtn} onPress={onAddCard}>
          <Ionicons name="add" size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={180} radius={borderRadius.md} />
            <Skeleton height={180} radius={borderRadius.md} />
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="card-outline"
              title="No cards saved"
              subtitle="Cards are added when you top up your wallet via Stripe."
              actionLabel="Add funds"
              onAction={onAddCard}
            />
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons name="lock-closed" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Secure by Stripe</Text>
                <Text style={styles.infoSub}>
                  Your card details are never stored on our servers. Stripe handles all sensitive data with bank-level encryption.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {cards.map((card) => (
              <View key={card.id} style={styles.cardWrap}>
                <LinearGradient
                  colors={BRAND_GRADIENT[card.brand]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGrad}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.brandName}>{formatBrand(card.brand)}</Text>
                    {card.isDefault ? (
                      <View style={styles.defaultPill}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardChipRow}>
                    <View style={styles.chip} />
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                    <Text style={styles.cardExp}>{card.exp}</Text>
                  </View>
                </LinearGradient>
                {!card.isDefault ? (
                  <TouchableOpacity style={styles.makeDefault} onPress={() => setDefault(card.id)}>
                    <Text style={styles.makeDefaultText}>Set as default</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}

            <TouchableOpacity style={styles.addCardBtn} onPress={onAddCard}>
              <View style={styles.addCardIcon}>
                <Ionicons name="add" size={20} color={colors.accent} />
              </View>
              <Text style={styles.addCardText}>Add a new card</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.faint} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  content: { padding: spacing.xl, paddingBottom: 40 },
  emptyWrap: { gap: spacing.xl, marginTop: spacing.lg },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  infoSub: { fontSize: 13, color: colors.muted, marginTop: 3, lineHeight: 18 },
  cardWrap: { gap: spacing.sm },
  cardGrad: {
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    height: 180,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  defaultText: { fontSize: 11.5, fontWeight: '700', color: '#fff' },
  cardChipRow: { flexDirection: 'row' },
  chip: {
    width: 36,
    height: 26,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.5,
  },
  cardExp: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  makeDefault: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  makeDefaultText: { fontSize: 13.5, fontWeight: '600', color: colors.accent },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
  },
  addCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
});
