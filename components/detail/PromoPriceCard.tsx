import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { fmtBRL } from '@/lib/format';
import { calcEconomia, isDescontoSuspeito } from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';

type Props = { promo: Promocao };

export function PromoPriceCard({ promo }: Props) {
  const suspeito = isDescontoSuspeito(promo);
  const desconto = Math.round(promo.percentual_desconto);
  const economia = calcEconomia(promo);

  return (
    <View style={styles.card}>
      {!suspeito ? (
        <Text style={styles.original}>{fmtBRL.format(promo.preco_original)}</Text>
      ) : null}
      <View style={styles.row}>
        <Text style={styles.current}>{fmtBRL.format(promo.preco_desconto)}</Text>
        {!suspeito ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{desconto}%</Text>
          </View>
        ) : (
          <View style={styles.badgeSuspeito}>
            <Text style={styles.badgeSuspeitoText}>Verificar na loja</Text>
          </View>
        )}
      </View>
      {!suspeito ? (
        <Text style={styles.economia}>Economia de {fmtBRL.format(economia)}</Text>
      ) : (
        <Text style={styles.avisoPreco}>
          Preço "De" informado pela loja ({fmtBRL.format(promo.preco_original)}) pode não refletir o valor real.
        </Text>
      )}
      {promo.frete_gratis ? (
        <View style={styles.freteChip}>
          <Text style={styles.freteText}>Frete grátis</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardLg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  original: {
    fontSize: 14,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  current: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.chip,
  },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  badgeSuspeito: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.chip,
  },
  badgeSuspeitoText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  economia: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  avisoPreco: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  freteChip: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.chip,
  },
  freteText: { fontSize: 12, fontWeight: '600', color: Colors.success },
});
