import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

export function DescontoSuspeitoBanner() {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <AlertTriangle size={16} color={Colors.danger} />
      <Text style={styles.text}>
        O desconto informado parece inflado. Confira o preço real diretamente na loja antes de comprar.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.cardSm,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.danger,
    lineHeight: 18,
  },
});
