import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

export function AffiliateNotice() {
  return (
    <View style={styles.root} accessibilityRole="text">
      <Text style={styles.text}>
        Ao abrir a oferta, você será redirecionado para o site da loja. Este é um link de afiliado
        e pode gerar comissão para o Merkaall, sem custo adicional para você.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardSm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
});
