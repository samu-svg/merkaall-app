import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, type ColorPalette } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

type Props = {
  label: string;
  icone?: string;
  contagem?: number;
  ativa: boolean;
  onPress: () => void;
};

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.chip,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipAtiva: { backgroundColor: c.primary, borderColor: c.primary },
    icone: { fontSize: 14 },
    label: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
    labelAtiva: { color: c.surface },
    badge: {
      fontSize: 10,
      fontWeight: '500',
      color: c.textTertiary,
      backgroundColor: c.background,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 6,
      overflow: 'hidden',
    },
    badgeAtivo: { color: c.surface, backgroundColor: 'rgba(255,255,255,0.25)' },
  });
}

const styles = createStyles(Colors);

export function CategoryChip({ label, icone, contagem, ativa, onPress }: Props) {
  const a11yLabel =
    contagem != null && contagem > 0 ? `${label}, ${contagem} itens` : label;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, ativa && styles.chipAtiva]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: ativa }}
    >
      {icone ? <Text style={styles.icone}>{icone}</Text> : null}
      <Text style={[styles.label, ativa && styles.labelAtiva]}>{label}</Text>
      {contagem != null && contagem > 0 && (
        <Text style={[styles.badge, ativa && styles.badgeAtivo]}>{contagem}</Text>
      )}
    </Pressable>
  );
}
