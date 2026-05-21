import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

type Props = { valor: string; label: string };

export function StatChip({ valor, label }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={styles.valor}>{valor}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.cardSm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  valor: { fontSize: 18, fontWeight: '500', color: Colors.primary },
  label: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center' },
});
