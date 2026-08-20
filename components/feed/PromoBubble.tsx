import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Heart } from 'lucide-react-native';

import { LojaBadge } from '@/components/LojaBadge';
import { ShareButton } from '@/components/ShareButton';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { formatHora } from '@/lib/feedGroup';
import { fmtBRL } from '@/lib/format';
import { getLojaNome, TEMA_PADRAO, TEMAS_LOJA } from '@/lib/lojas';
import { getPromoCapa } from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';
import type { PromocaoFeedEnriquecida } from '@/hooks/useFeedPersonalizado';

type Props = {
  promo: PromocaoFeedEnriquecida;
  salvo: boolean;
  onToggleSalvo: (promo: Promocao) => void;
  onOpenDetail?: (promo: Promocao) => void;
};

function lojaInicial(promo: Pick<Promocao, 'loja' | 'link_afiliado'>): string {
  const nome = getLojaNome(promo);
  return nome.charAt(0).toUpperCase();
}

export function PromoBubble({ promo, salvo, onToggleSalvo, onOpenDetail }: Props) {
  const desconto = Math.round(promo.percentual_desconto);
  const capa = getPromoCapa(promo);
  const nome = getLojaNome(promo);
  const tema = TEMAS_LOJA[nome] ?? TEMA_PADRAO;

  function handleOpen() {
    if (!onOpenDetail) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenDetail(promo);
  }

  function handleSalvar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSalvo(promo);
  }

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: tema.background, borderColor: tema.borda }]}>
        <Text style={[styles.avatarText, { color: tema.texto }]}>{lojaInicial(promo)}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sender}>{nome}</Text>

        <Pressable
          onPress={handleOpen}
          disabled={!onOpenDetail}
          style={({ pressed }) => [styles.bubble, pressed && onOpenDetail && styles.bubblePressed]}
        >
          {promo.recomendado ? (
            <View style={styles.recomendadoBadge}>
              <Text style={styles.recomendadoText}>Recomendado</Text>
            </View>
          ) : null}

          {capa ? (
            <Image source={{ uri: capa }} style={styles.image} contentFit="contain" transition={150} />
          ) : null}

          <LojaBadge promo={promo} compact />
          <Text style={styles.titulo} numberOfLines={3}>
            {promo.titulo}
          </Text>

          <View style={styles.precos}>
            <Text style={styles.precoOriginal}>{fmtBRL.format(promo.preco_original)}</Text>
            <Text style={styles.precoAtual}>{fmtBRL.format(promo.preco_desconto)}</Text>
            <View style={styles.descontoBadge}>
              <Text style={styles.descontoText}>-{desconto}%</Text>
            </View>
          </View>

          {promo.frete_gratis ? <Text style={styles.frete}>Frete grátis</Text> : null}

          <View style={styles.footer}>
            <Text style={styles.hora}>{formatHora(promo.criada_em)}</Text>
            <View style={styles.actions}>
              <ShareButton promo={promo} />
              <Pressable onPress={handleSalvar} style={styles.heartBtn}>
                <Heart size={14} color={Colors.primary} fill={salvo ? Colors.primary : 'none'} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  content: { flex: 1, maxWidth: '88%' },
  sender: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardSm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  bubblePressed: { opacity: 0.92 },
  recomendadoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.chip,
  },
  recomendadoText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: Radius.chip,
    backgroundColor: Colors.background,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  precos: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  precoOriginal: {
    fontSize: 12,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  precoAtual: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  descontoBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.chip,
  },
  descontoText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  frete: { fontSize: 11, color: Colors.success, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  hora: { fontSize: 10, color: Colors.textTertiary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  heartBtn: { padding: 4 },
});
