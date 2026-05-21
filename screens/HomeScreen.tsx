import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bell } from 'lucide-react-native';

import { CategoryChip } from '@/components/CategoryChip';
import { FeaturedCard } from '@/components/FeaturedCard';
import { FilterRow } from '@/components/FilterRow';
import { LiveBadge } from '@/components/LiveBadge';
import { PromoCard } from '@/components/PromoCard';
import { SearchBar } from '@/components/SearchBar';
import { StatChip } from '@/components/StatChip';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { fmtBRL } from '@/lib/format';
import { CATEGORIA_TODAS, ICONES_CATEGORIA, TODAS_AS_CATEGORIAS, FILTROS_PADRAO, type FiltrosAtivos } from '@/lib/types';
import { useSavedStore } from '@/store/useSavedStore';
import { usePromocoesFeed } from '@/hooks/usePromocoesFeed';

export function HomeScreen() {
  const [filtros, setFiltros] = useState<FiltrosAtivos>(FILTROS_PADRAO);
  const [busca, setBusca] = useState('');

  const { promocoes, total, destaques, maiorDesconto, menorPreco, contagemPorCategoria, loading, refreshing, error, aoVivo, refresh } =
    usePromocoesFeed(filtros);

  const { toggle, isSaved } = useSavedStore();

  const listagem = useMemo(() => {
    if (!busca.trim()) return promocoes;
    const q = busca.toLowerCase();
    return promocoes.filter((p) => p.titulo.toLowerCase().includes(q) || (p.categoria ?? '').toLowerCase().includes(q));
  }, [promocoes, busca]);

  const destaque = destaques[0] ?? null;
  const categorias = [CATEGORIA_TODAS, ...TODAS_AS_CATEGORIAS];

  function setCategoria(cat: string) {
    setFiltros((prev) => ({ ...prev, categoria: cat }));
  }

  function toggleFrete() {
    setFiltros((prev) => ({ ...prev, freteGratis: !prev.freteGratis }));
  }

  const header = (
    <View style={styles.headerWrap}>
      {/* Marca + Live */}
      <View style={styles.brandRow}>
        <View style={styles.logo}><Text style={styles.logoText}>P</Text></View>
        <View style={styles.brandTexts}>
          <Text style={styles.title}>PromoçãoPro</Text>
          <Text style={styles.subtitle}>Curado por IA · Mercado Livre</Text>
        </View>
        <View style={styles.headerRight}>
          <LiveBadge aoVivo={aoVivo} />
          <Bell size={20} color={Colors.textSecondary} />
        </View>
      </View>

      {/* Search */}
      <SearchBar value={busca} onChangeText={setBusca} />

      {/* Stats */}
      {!loading && (
        <View style={styles.statsRow}>
          <StatChip valor={String(total)} label="promoções ativas" />
          <StatChip valor={`${Math.round(maiorDesconto)}%`} label="maior desconto" />
          <StatChip valor={fmtBRL.format(menorPreco)} label="menor preço" />
        </View>
      )}

      {/* Erro */}
      {error ? (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      {/* Featured */}
      {destaque && !loading && <FeaturedCard promo={destaque} />}

      {/* Categorias */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categorias}>
        {categorias.map((cat) => (
          <CategoryChip
            key={cat}
            label={cat}
            icone={ICONES_CATEGORIA[cat]}
            contagem={cat === CATEGORIA_TODAS ? total : contagemPorCategoria[cat]}
            ativa={filtros.categoria === cat}
            onPress={() => setCategoria(cat)}
          />
        ))}
      </ScrollView>

      {/* Filtros */}
      <FilterRow
        freteGratis={filtros.freteGratis}
        onToggleFrete={toggleFrete}
        onOpenFiltros={() => {}}
        onOpenOrdenar={() => {}}
      />

      {/* Contagem */}
      <Text style={styles.contagem}>
        <Text style={styles.contagemNum}>{listagem.length}</Text>
        {' '}{listagem.length === 1 ? 'promoção' : 'promoções'}
        {filtros.categoria !== CATEGORIA_TODAS ? <Text style={styles.contagemCat}> em {filtros.categoria}</Text> : null}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={listagem}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <PromoCard promo={item} salvo={isSaved(item.id)} onToggleSalvo={toggle} />
          </View>
        )}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            : <View style={styles.empty}><Text style={styles.emptyEmoji}>🔍</Text><Text style={styles.emptyText}>Nenhuma promoção encontrada</Text></View>
        }
        ListFooterComponent={<View style={styles.footer}><Text style={styles.footerText}>Preços podem mudar. Links podem gerar comissão.</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  headerWrap: { gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  logo: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '500' },
  brandTexts: { flex: 1 },
  title: { fontSize: 18, fontWeight: '500', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  categorias: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  contagem: { fontSize: 13, fontWeight: '400', color: Colors.textSecondary, marginTop: Spacing.xs },
  contagemNum: { fontWeight: '500', color: Colors.textPrimary },
  contagemCat: { color: Colors.primary },
  row: { gap: Spacing.sm },
  cardWrap: { flex: 1 },
  loader: { marginTop: 48 },
  empty: { padding: 40, alignItems: 'center', gap: Spacing.sm },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: Radius.cardSm, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  errorText: { color: Colors.danger, fontSize: 13 },
  footer: { marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 11, color: Colors.textTertiary, textAlign: 'center' },
});
