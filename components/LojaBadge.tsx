import { StyleSheet, Text, View } from 'react-native';

import { getLojaNome, TEMA_PADRAO, TEMAS_LOJA } from '@/lib/lojas';
import type { Promocao } from '@/lib/types';

type Props = {
  promo: Pick<Promocao, 'loja' | 'link_afiliado'>;
  compact?: boolean;
};

export function LojaBadge({ promo, compact = false }: Props) {
  const nome = getLojaNome(promo);
  const tema = TEMAS_LOJA[nome] ?? TEMA_PADRAO;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: tema.background, borderColor: tema.borda },
      ]}
    >
      <Text
        style={[styles.texto, compact && styles.textoCompact, { color: tema.texto }]}
        numberOfLines={1}
      >
        {nome}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeCompact: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  texto: {
    fontSize: 10,
    fontWeight: '700',
  },
  textoCompact: {
    fontSize: 9,
  },
});
