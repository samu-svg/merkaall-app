import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { fmtBRL } from '@/lib/format';
import { getPromoCapa } from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';

type Props = {
  promo: Promocao;
  onPress: () => void;
};

export function PromoMiniCard({ promo, onPress }: Props) {
  const desconto = Math.round(promo.percentual_desconto);
  const capa = getPromoCapa(promo);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        {capa ? (
          <Image source={{ uri: capa }} style={styles.image} contentFit="contain" transition={150} />
        ) : (
          <Text style={styles.semImg}>—</Text>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>-{desconto}%</Text>
        </View>
      </View>
      <Text style={styles.titulo} numberOfLines={2}>
        {promo.titulo}
      </Text>
      <Text style={styles.preco}>{fmtBRL.format(promo.preco_desconto)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardSm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  pressed: { opacity: 0.9 },
  imageWrap: {
    width: '100%',
    height: 88,
    borderRadius: 8,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  semImg: { textAlign: 'center', marginTop: 32, color: Colors.textTertiary, fontSize: 11 },
  badge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  titulo: { fontSize: 11, color: Colors.textSecondary, lineHeight: 14 },
  preco: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
