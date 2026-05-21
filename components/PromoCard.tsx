import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Heart } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { fmtBRL } from '@/lib/format';
import type { Promocao } from '@/lib/types';

type Props = {
  promo: Promocao;
  salvo: boolean;
  onToggleSalvo: (promo: Promocao) => void;
};

export function PromoCard({ promo, salvo, onToggleSalvo }: Props) {
  const desconto = Math.round(promo.percentual_desconto);

  const handleSalvar = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSalvo(promo);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {promo.foto_url ? (
          <Image source={{ uri: promo.foto_url }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.semImagem}>sem imagem</Text>
        )}
        <View style={styles.badgeDesconto}>
          <Text style={styles.badgeDescontoText}>-{desconto}%</Text>
        </View>
        {promo.avaliacao != null && (
          <View style={styles.badgeRating}>
            <Text style={styles.ratingText}>★ {promo.avaliacao.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.titulo} numberOfLines={2}>{promo.titulo}</Text>
        <Text style={styles.precoOriginal}>{fmtBRL.format(promo.preco_original)}</Text>
        <Text style={styles.precoAtual}>{fmtBRL.format(promo.preco_desconto)}</Text>

        <View style={styles.footer}>
          {promo.frete_gratis ? (
            <Text style={styles.frete}>Frete grátis</Text>
          ) : <View />}
          <Pressable onPress={handleSalvar} style={styles.heartBtn}>
            <Heart
              size={14}
              color={Colors.primary}
              fill={salvo ? Colors.primary : 'none'}
            />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => void Linking.openURL(promo.link_afiliado)}
      >
        <Text style={styles.ctaText}>Ver oferta →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardSm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: Colors.background,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  semImagem: { fontSize: 11, color: Colors.textTertiary },
  badgeDesconto: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.chip,
  },
  badgeDescontoText: { color: '#fff', fontSize: 10, fontWeight: '500' },
  badgeRating: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.starBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.chip,
  },
  ratingText: { fontSize: 10, color: Colors.star, fontWeight: '500' },
  body: { padding: Spacing.sm, gap: 2 },
  titulo: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  precoOriginal: {
    fontSize: 10,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  precoAtual: { fontSize: 15, fontWeight: '500', color: Colors.primary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  frete: { fontSize: 10, color: Colors.success, fontWeight: '500' },
  heartBtn: {
    backgroundColor: Colors.primaryLight,
    padding: 5,
    borderRadius: 6,
  },
  cta: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: '#fff', fontSize: 12, fontWeight: '500' },
});
