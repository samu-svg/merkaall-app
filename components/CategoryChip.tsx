import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

type Props = {
  label: string;
  icone?: string;
  contagem?: number;
  ativa: boolean;
  onPress: () => void;
};

export function CategoryChip({ label, icone, contagem, ativa, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, ativa && styles.chipAtiva]}
    >
      {icone ? <Text style={styles.icone}>{icone}</Text> : null}
      <Text style={[styles.label, ativa && styles.labelAtiva]}>{label}</Text>
      {contagem != null && contagem > 0 && (
        <Text style={[styles.badge, ativa && styles.badgeAtivo]}>{contagem}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipAtiva: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  icone: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  labelAtiva: { color: Colors.surface },
  badge: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textTertiary,
    backgroundColor: Colors.background,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeAtivo: { color: Colors.surface, backgroundColor: 'rgba(255,255,255,0.25)' },
});
