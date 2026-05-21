import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { PromoCard } from '@/components/PromoCard';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { useSavedStore } from '@/store/useSavedStore';

export function SavedScreen() {
  const { saved, toggle, isSaved, remove } = useSavedStore();

  const empty = (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🤍</Text>
      <Text style={styles.emptyTitle}>Nenhuma promoção salva ainda</Text>
      <Text style={styles.emptyHint}>Toque no coração em qualquer oferta para salvar aqui.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Salvos</Text>
        {saved.length > 0 && (
          <Text style={styles.count}>{saved.length} {saved.length === 1 ? 'item' : 'itens'}</Text>
        )}
      </View>

      <FlatList
        data={saved}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <PromoCard
              promo={item}
              salvo={isSaved(item.id)}
              onToggleSalvo={toggle}
            />
            <Pressable style={styles.removeBtn} onPress={() => remove(item.id)}>
              <Trash2 size={12} color={Colors.danger} />
              <Text style={styles.removeTxt}>Remover</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: 20, fontWeight: '500', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textTertiary },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  cardWrap: { flex: 1, gap: Spacing.xs },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.chip,
  },
  removeTxt: { fontSize: 11, color: Colors.danger },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48, gap: Spacing.sm },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary, textAlign: 'center' },
  emptyHint: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20 },
});
