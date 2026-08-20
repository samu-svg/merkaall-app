import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { descricaoFallbackBullets, descricaoUtil } from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';

type Props = { promo: Promocao };

export function DescriptionSection({ promo }: Props) {
  const [expanded, setExpanded] = useState(false);
  const util = descricaoUtil(promo);
  const bullets = descricaoFallbackBullets(promo);
  const longText = util != null && util.length > 200;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Descrição</Text>
      {util ? (
        <>
          <Text style={styles.body} numberOfLines={expanded ? undefined : 6}>
            {util}
          </Text>
          {longText ? (
            <Pressable onPress={() => setExpanded((v) => !v)}>
              <Text style={styles.toggle}>{expanded ? 'Ver menos' : 'Ver mais'}</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <View style={styles.bullets}>
          {bullets.map((b) => (
            <Text key={b} style={styles.bullet}>
              • {b}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  toggle: { fontSize: 14, fontWeight: '500', color: Colors.primary, marginTop: Spacing.xs },
  bullets: { gap: Spacing.xs },
  bullet: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
});
