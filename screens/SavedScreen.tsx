import { useMemo, useState } from 'react';

import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as Haptics from 'expo-haptics';

import { Trash2 } from 'lucide-react-native';

import { AppFooter } from '@/components/AppFooter';
import { CategoryChip } from '@/components/CategoryChip';
import { PromoCard } from '@/components/PromoCard';
import { Colors, type ColorPalette } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';
import type { Promocao } from '@/lib/types';
import { useSavedStore } from '@/store/useSavedStore';
import { usePromoDetailStore } from '@/store/usePromoDetailStore';

type SortOption = 'recentes' | 'desconto' | 'expira' | 'queda';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'recentes', label: 'Recentes' },
  { key: 'desconto', label: 'Maior desconto' },
  { key: 'expira', label: 'Expira antes' },
  { key: 'queda', label: 'Maior queda' },
];

function sortSaved(
  list: Promocao[],
  sort: SortOption,
  getPrecoQuandoSalvo: (id: string) => number | undefined,
): Promocao[] {
  const copy = [...list];

  switch (sort) {
    case 'desconto':
      return copy.sort((a, b) => b.percentual_desconto - a.percentual_desconto);
    case 'expira':
      return copy.sort((a, b) => {
        if (!a.expires_at && !b.expires_at) return 0;
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      });
    case 'queda':
      return copy.sort((a, b) => {
        const quedaA = (getPrecoQuandoSalvo(a.id) ?? a.preco_desconto) - a.preco_desconto;
        const quedaB = (getPrecoQuandoSalvo(b.id) ?? b.preco_desconto) - b.preco_desconto;
        return quedaB - quedaA;
      });
    default:
      return copy;
  }
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    title: { fontSize: 20, fontWeight: '500', color: c.textPrimary },
    count: { fontSize: 13, color: c.textTertiary },
    sortScroll: { flexGrow: 0, marginBottom: Spacing.sm },
    sortRow: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
    row: { gap: Spacing.sm, marginBottom: Spacing.sm },
    cardWrap: { flex: 1, gap: Spacing.xs },
    removeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: Spacing.xs,
      backgroundColor: c.dangerLight,
      borderRadius: Radius.chip,
    },
    removeTxt: { fontSize: 11, color: c.danger },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48, gap: Spacing.sm },
    emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
    emptyTitle: { fontSize: 16, fontWeight: '500', color: c.textPrimary, textAlign: 'center' },
    emptyHint: { fontSize: 13, color: c.textTertiary, textAlign: 'center', lineHeight: 20 },
  });
}

const styles = createStyles(Colors);

export function SavedScreen() {
  const { numColumns, contentMaxWidth } = useResponsive();
  const { saved, toggle, isSaved, remove, getPrecoQuandoSalvo, precoQuandoSalvo } =
    useSavedStore();
  const openDetail = usePromoDetailStore((s) => s.open);
  const [sort, setSort] = useState<SortOption>('recentes');

  const sorted = useMemo(
    () => sortSaved(saved, sort, getPrecoQuandoSalvo),
    [saved, sort, getPrecoQuandoSalvo, precoQuandoSalvo],
  );

  function handleSortChange(next: SortOption) {
    if (next === sort) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSort(next);
  }

  const empty = (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🤍</Text>
      <Text style={styles.emptyTitle}>Nenhuma promoção salva ainda</Text>
      <Text style={styles.emptyHint}>Toque no coração em qualquer oferta para salvar aqui.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Salvos</Text>
        {saved.length > 0 && (
          <Text style={styles.count}>{saved.length} {saved.length === 1 ? 'item' : 'itens'}</Text>
        )}
      </View>

      {saved.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
          style={styles.sortScroll}
        >
          {SORT_OPTIONS.map(({ key, label }) => (
            <CategoryChip
              key={key}
              label={label}
              ativa={sort === key}
              onPress={() => handleSortChange(key)}
            />
          ))}
        </ScrollView>
      ) : null}

      <FlatList
        key={`cols-${numColumns}`}
        data={sorted}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.list,
          { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
        ]}
        ListEmptyComponent={empty}
        ListFooterComponent={saved.length > 0 ? <AppFooter /> : null}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <PromoCard
              promo={item}
              salvo={isSaved(item.id)}
              precoQuandoSalvo={getPrecoQuandoSalvo(item.id)}
              onOpenDetail={openDetail}
              onToggleSalvo={toggle}
            />
            <Pressable
              style={styles.removeBtn}
              onPress={() => remove(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${item.titulo} dos salvos`}
            >
              <Trash2 size={12} color={Colors.danger} />
              <Text style={styles.removeTxt}>Remover</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
