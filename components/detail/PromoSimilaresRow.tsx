import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PromoMiniCard } from '@/components/detail/PromoMiniCard';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import type { Promocao } from '@/lib/types';

type Props = {
  similares: Promocao[];
  carregando: boolean;
  onSelect: (promo: Promocao) => void;
};

export function PromoSimilaresRow({ similares, carregando, onSelect }: Props) {
  if (!carregando && similares.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Ofertas parecidas</Text>
      {carregando ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {similares.map((p) => (
            <PromoMiniCard key={p.id} promo={p} onPress={() => onSelect(p)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md, marginHorizontal: -Spacing.lg },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
  },
  loader: { paddingVertical: Spacing.lg },
  row: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
});
