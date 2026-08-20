import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SlidersHorizontal, Truck, ArrowUpDown, Clock } from 'lucide-react-native';

import { Colors, type ColorPalette } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

type Props = {
  freteGratis: boolean;
  expiraEmBreve: boolean;
  filtrosAtivos: boolean;
  onToggleFrete: () => void;
  onToggleExpira: () => void;
  onOpenFiltros: () => void;
  onOpenOrdenar: () => void;
};

type ChipProps = {
  label: string;
  icon?: React.ReactNode;
  ativo?: boolean;
  onPress: () => void;
  a11yLabel?: string;
};

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
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
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipAtivo: { backgroundColor: c.primary, borderColor: c.primary },
    chipInner: { flexDirection: 'row', alignItems: 'center', gap: 5, position: 'relative' },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.primary,
      marginLeft: 2,
    },
    chipText: { fontSize: 12, fontWeight: '500', color: c.textSecondary },
    chipTextAtivo: { color: c.surface },
    ordenar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.chip,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    ordenarText: { fontSize: 12, fontWeight: '500', color: c.textSecondary },
  });
}

const styles = createStyles(Colors);

function FilterChip({ label, icon, ativo, badge, onPress, a11yLabel }: ChipProps & { badge?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, ativo && styles.chipAtivo]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ selected: !!ativo }}
    >
      <View style={styles.chipInner}>
        {icon}
        <Text style={[styles.chipText, ativo && styles.chipTextAtivo]}>{label}</Text>
        {badge && <View style={styles.dot} />}
      </View>
    </Pressable>
  );
}

export function FilterRow({
  freteGratis,
  expiraEmBreve,
  filtrosAtivos,
  onToggleFrete,
  onToggleExpira,
  onOpenFiltros,
  onOpenOrdenar,
}: Props) {
  return (
    <View style={styles.row}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <FilterChip
          label="Filtrar"
          badge={filtrosAtivos}
          icon={<SlidersHorizontal size={13} color={filtrosAtivos ? Colors.primary : Colors.textSecondary} />}
          onPress={onOpenFiltros}
          a11yLabel={filtrosAtivos ? 'Filtrar, filtros ativos' : 'Filtrar'}
        />
        <FilterChip
          label="Frete grátis"
          icon={<Truck size={13} color={freteGratis ? Colors.surface : Colors.textSecondary} />}
          ativo={freteGratis}
          onPress={onToggleFrete}
          a11yLabel="Frete grátis"
        />
        <FilterChip
          label="Últimas horas"
          icon={<Clock size={13} color={expiraEmBreve ? Colors.surface : Colors.textSecondary} />}
          ativo={expiraEmBreve}
          onPress={onToggleExpira}
          a11yLabel="Últimas horas, expira em breve"
        />
      </ScrollView>
      <Pressable
        onPress={onOpenOrdenar}
        style={styles.ordenar}
        accessibilityRole="button"
        accessibilityLabel="Ordenar promoções"
      >
        <ArrowUpDown size={13} color={Colors.textSecondary} />
        <Text style={styles.ordenarText}>Ordenar</Text>
      </Pressable>
    </View>
  );
}
