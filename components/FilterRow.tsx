import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SlidersHorizontal, Truck, ArrowUpDown } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

type Props = {
  freteGratis: boolean;
  onToggleFrete: () => void;
  onOpenFiltros: () => void;
  onOpenOrdenar: () => void;
};

type ChipProps = {
  label: string;
  icon?: React.ReactNode;
  ativo?: boolean;
  onPress: () => void;
};

function FilterChip({ label, icon, ativo, onPress }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]}>
      {icon}
      <Text style={[styles.chipText, ativo && styles.chipTextAtivo]}>{label}</Text>
    </Pressable>
  );
}

export function FilterRow({ freteGratis, onToggleFrete, onOpenFiltros, onOpenOrdenar }: Props) {
  return (
    <View style={styles.row}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <FilterChip
          label="Filtrar"
          icon={<SlidersHorizontal size={13} color={Colors.textSecondary} />}
          onPress={onOpenFiltros}
        />
        <FilterChip
          label="Frete grátis"
          icon={<Truck size={13} color={freteGratis ? Colors.surface : Colors.textSecondary} />}
          ativo={freteGratis}
          onPress={onToggleFrete}
        />
      </ScrollView>
      <Pressable onPress={onOpenOrdenar} style={styles.ordenar}>
        <ArrowUpDown size={13} color={Colors.textSecondary} />
        <Text style={styles.ordenarText}>Ordenar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scroll: { gap: Spacing.sm, paddingRight: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipAtivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  chipTextAtivo: { color: Colors.surface },
  ordenar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  ordenarText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
});
