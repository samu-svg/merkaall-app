import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Heart } from 'lucide-react-native';
import { ShareButton } from '@/components/ShareButton';
import { LojaBadge } from '@/components/LojaBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Colors, type ColorPalette } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { fmtBRL } from '@/lib/format';
import { getPromoCapa, isExpiringSoon } from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';

type Props = {
  promo: Promocao;
  salvo: boolean;
  onToggleSalvo: (promo: Promocao) => void;
  onOpenDetail?: (promo: Promocao) => void;
  precoQuandoSalvo?: number;
};

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: Radius.cardSm,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    tappable: { flex: 1 },
    tappablePressed: { opacity: 0.92 },
    imageWrap: {
      aspectRatio: 1,
      backgroundColor: c.background,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: { width: '100%', height: '100%' },
    semImagem: { fontSize: 11, color: c.textTertiary },
    badgeDesconto: {
      position: 'absolute',
      top: Spacing.sm,
      left: Spacing.sm,
      backgroundColor: c.success,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.chip,
    },
    badgeDescontoText: { color: '#fff', fontSize: 10, fontWeight: '500' },
    badgeRating: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: c.starBg,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: Radius.chip,
    },
    ratingText: { fontSize: 10, color: c.star, fontWeight: '500' },
    savedBadges: {
      position: 'absolute',
      left: Spacing.sm,
      right: Spacing.sm,
      bottom: Spacing.sm,
      gap: 4,
    },
    badgePrecoCaiu: {
      alignSelf: 'flex-start',
      backgroundColor: c.success,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.chip,
    },
    badgePrecoCaiuText: { color: '#fff', fontSize: 9, fontWeight: '600' },
    badgeExpira: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: c.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.chip,
    },
    badgeExpiraText: { color: '#fff', fontSize: 9, fontWeight: '600' },
    badgeExpiraTimer: { fontSize: 9, fontWeight: '600', color: '#fff' },
    body: { padding: Spacing.sm, paddingBottom: 0, gap: 2 },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    titulo: { fontSize: 11, color: c.textSecondary, lineHeight: 15 },
    precoOriginal: {
      fontSize: 10,
      color: c.textTertiary,
      textDecorationLine: 'line-through',
      marginTop: 4,
    },
    precoAtual: { fontSize: 15, fontWeight: '500', color: c.primary, marginBottom: 4 },
    frete: { fontSize: 10, color: c.success, fontWeight: '500' },
    footerSpacer: { flex: 1 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    heartBtn: {
      backgroundColor: c.primaryLight,
      padding: 5,
      borderRadius: 6,
    },
    cta: {
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    ctaPressed: { opacity: 0.85 },
    ctaText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  });
}

const styles = createStyles(Colors);

export function PromoCard({ promo, salvo, onToggleSalvo, onOpenDetail, precoQuandoSalvo }: Props) {
  const desconto = Math.round(promo.percentual_desconto);
  const capa = getPromoCapa(promo);
  const precoCaiu =
    precoQuandoSalvo != null && promo.preco_desconto < precoQuandoSalvo;
  const diferencaPreco = precoCaiu ? precoQuandoSalvo - promo.preco_desconto : 0;
  const expiraEmBreve = isExpiringSoon(promo.expires_at);

  const cardA11yLabel = `${promo.titulo}, ${desconto}% de desconto, ${fmtBRL.format(promo.preco_desconto)}`;

  const handleSalvar = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSalvo(promo);
  };

  function handleOpenDetail() {
    if (!onOpenDetail) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenDetail(promo);
  }

  return (
    <View style={styles.card}>
      <Pressable
        onPress={handleOpenDetail}
        disabled={!onOpenDetail}
        style={({ pressed }) => [styles.tappable, pressed && onOpenDetail && styles.tappablePressed]}
        accessibilityRole="button"
        accessibilityLabel={cardA11yLabel}
      >
        <View style={styles.imageWrap}>
          {capa ? (
            <Image source={{ uri: capa }} style={styles.image} contentFit="contain" transition={150} />
          ) : (
            <Text style={styles.semImagem}>sem imagem</Text>
          )}
          <View style={styles.badgeDesconto}>
            <Text style={styles.badgeDescontoText}>-{desconto}%</Text>
          </View>
          {promo.avaliacao != null && (
            <View style={styles.badgeRating}>
              <Text style={styles.ratingText}>★ {Number(promo.avaliacao).toFixed(1)}</Text>
            </View>
          )}
          {(precoCaiu || expiraEmBreve) && (
            <View style={styles.savedBadges}>
              {precoCaiu ? (
                <View style={styles.badgePrecoCaiu}>
                  <Text style={styles.badgePrecoCaiuText}>
                    Preço caiu {fmtBRL.format(diferencaPreco)}
                  </Text>
                </View>
              ) : null}
              {expiraEmBreve && promo.expires_at ? (
                <View style={styles.badgeExpira}>
                  <Text style={styles.badgeExpiraText}>Expira em </Text>
                  <CountdownTimer expiresAt={promo.expires_at} style={styles.badgeExpiraTimer} />
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.body}>
          <LojaBadge promo={promo} compact />
          <Text style={styles.titulo} numberOfLines={2}>{promo.titulo}</Text>
          <Text style={styles.precoOriginal}>{fmtBRL.format(promo.preco_original)}</Text>
          <Text style={styles.precoAtual}>{fmtBRL.format(promo.preco_desconto)}</Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        {promo.frete_gratis ? (
          <Text style={styles.frete}>Frete grátis</Text>
        ) : (
          <View style={styles.footerSpacer} />
        )}
        <View style={styles.actions}>
          <ShareButton promo={promo} />
          <Pressable
            onPress={handleSalvar}
            style={styles.heartBtn}
            accessibilityRole="button"
            accessibilityLabel={salvo ? 'Remover dos salvos' : 'Salvar promoção'}
            accessibilityState={{ selected: salvo }}
          >
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
        onPress={handleOpenDetail}
        disabled={!onOpenDetail}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${promo.titulo}`}
      >
        <Text style={styles.ctaText}>Ver detalhes</Text>
      </Pressable>
    </View>
  );
}
