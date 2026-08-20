import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CountdownTimer } from '@/components/CountdownTimer';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { formatRelativeCriadaEm } from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';

type Props = { promo: Promocao };

function Chip({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <View style={[styles.chip, highlight && styles.chipHighlight]}>
      <Text style={[styles.chipText, highlight && styles.chipTextHighlight]}>{label}</Text>
    </View>
  );
}

export function TrustChipsRow({ promo }: Props) {
  const chips: { label: string; highlight?: boolean }[] = [];

  if (promo.avaliacao != null) {
    chips.push({ label: `★ ${Number(promo.avaliacao).toFixed(1)}` });
  }
  if (promo.frete_gratis) {
    chips.push({ label: 'Frete grátis', highlight: true });
  }
  if (promo.criada_em) {
    chips.push({ label: `Publicado ${formatRelativeCriadaEm(promo.criada_em)}` });
  }

  if (chips.length === 0 && !promo.expires_at) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips.map((c) => (
          <Chip key={c.label} label={c.label} highlight={c.highlight} />
        ))}
        {promo.expires_at ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>Expira </Text>
            <CountdownTimer expiresAt={promo.expires_at} style={styles.timer} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: -Spacing.lg },
  row: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipHighlight: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  chipTextHighlight: { color: Colors.success },
  timer: { fontSize: 12, fontWeight: '600', color: Colors.primaryText },
});
