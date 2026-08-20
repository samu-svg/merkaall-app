import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Zap } from 'lucide-react-native';
import { ShareButton } from '@/components/ShareButton';
import { LojaBadge } from '@/components/LojaBadge';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { fmtBRL } from '@/lib/format';
import { getPromoCapa } from '@/lib/promoFormat';
import { CountdownTimer } from '@/components/CountdownTimer';
import type { Promocao } from '@/lib/types';

type Props = {
  promo: Promocao;
  onOpenDetail?: (promo: Promocao) => void;
};

export function FeaturedCard({ promo, onOpenDetail }: Props) {
  const desconto = Math.round(promo.percentual_desconto);
  const capa = getPromoCapa(promo);

  function handleOpenDetail() {
    if (!onOpenDetail) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenDetail(promo);
  }

  return (
    <View style={styles.card}>
      <View style={styles.tag}>
        <Zap size={12} color={Colors.primary} />
        <Text style={styles.tagText}>Melhor oferta do dia</Text>
        {promo.expires_at && (
          <>
            <Text style={styles.tagSep}>·</Text>
            <Text style={styles.tagText}>expira em </Text>
            <CountdownTimer expiresAt={promo.expires_at} />
          </>
        )}
        <View style={styles.tagSpacer} />
        <ShareButton promo={promo} size={13} />
      </View>

      <Pressable
        onPress={handleOpenDetail}
        disabled={!onOpenDetail}
        style={({ pressed }) => [pressed && onOpenDetail && styles.bodyPressed]}
      >
        <View style={styles.body}>
          <View style={styles.imageWrap}>
            {capa ? (
              <Image source={{ uri: capa }} style={styles.image} contentFit="contain" transition={150} />
            ) : (
              <Text style={styles.semImagem}>sem img</Text>
            )}
          </View>

          <View style={styles.info}>
            <LojaBadge promo={promo} />
            <Text style={styles.titulo} numberOfLines={2}>{promo.titulo}</Text>
            <Text style={styles.precoOriginal}>{fmtBRL.format(promo.preco_original)}</Text>
            <View style={styles.precoRow}>
              <Text style={styles.precoAtual}>{fmtBRL.format(promo.preco_desconto)}</Text>
              <View style={styles.badgeDesconto}>
                <Text style={styles.badgeText}>-{desconto}%</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={handleOpenDetail}
        disabled={!onOpenDetail}
      >
        <Text style={styles.ctaText}>Ver detalhes</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardLg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
  },
  tagSpacer: { flex: 1 },
  tagText: { fontSize: 11, color: Colors.primaryText, fontWeight: '500' },
  tagSep: { fontSize: 11, color: Colors.textTertiary },
  bodyPressed: { opacity: 0.92 },
  body: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  image: { width: '100%', height: '100%' },
  semImagem: { fontSize: 10, color: Colors.textTertiary },
  info: { flex: 1, gap: 2 },
  titulo: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary, lineHeight: 18 },
  precoOriginal: {
    fontSize: 11,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  precoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  precoAtual: { fontSize: 20, fontWeight: '500', color: Colors.primary },
  badgeDesconto: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.chip,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '500' },
  cta: {
    margin: Spacing.md,
    marginTop: 0,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
