import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { ICONES_CATEGORIA, TODAS_AS_CATEGORIAS } from '@/lib/types';
import {
  FEED_CATEGORIAS_MAX,
  FEED_CATEGORIAS_MIN,
} from '@/store/useFeedPrefsStore';

type Props = {
  selecionadas: Set<string>;
  onChange: (next: Set<string>) => void;
  min?: number;
  max?: number;
  showCounter?: boolean;
};

export function CategoryPicker({
  selecionadas,
  onChange,
  min = FEED_CATEGORIAS_MIN,
  max = FEED_CATEGORIAS_MAX,
  showCounter = true,
}: Props) {
  const toggleCategoria = useCallback(
    (categoria: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = new Set(selecionadas);
      if (next.has(categoria)) {
        next.delete(categoria);
      } else if (next.size < max) {
        next.add(categoria);
      }
      onChange(next);
    },
    [selecionadas, max, onChange],
  );

  return (
    <View style={styles.wrap}>
      {showCounter && (
        <Text style={styles.contador}>
          {selecionadas.size}/{max} selecionadas
          {min > 1 ? ` (mín. ${min})` : ''}
        </Text>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.chipsWrap}
        showsVerticalScrollIndicator={false}
      >
        {TODAS_AS_CATEGORIAS.map((categoria) => {
          const ativa = selecionadas.has(categoria);
          const icone = ICONES_CATEGORIA[categoria] ?? '🏷️';
          return (
            <Pressable
              key={categoria}
              style={[styles.chip, ativa && styles.chipAtiva]}
              onPress={() => toggleCategoria(categoria)}
              accessibilityRole="button"
              accessibilityLabel={`${ativa ? 'Desmarcar' : 'Selecionar'} categoria ${categoria}`}
              accessibilityState={{ selected: ativa }}
            >
              <Text style={styles.chipText}>
                {icone} {categoria}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function isCategorySelectionValid(
  selecionadas: Set<string>,
  min = FEED_CATEGORIAS_MIN,
  max = FEED_CATEGORIAS_MAX,
): boolean {
  return selecionadas.size >= min && selecionadas.size <= max;
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  contador: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  scroll: { flex: 1 },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipAtiva: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});
