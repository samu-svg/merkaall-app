import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
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
import { FilterModal } from '@/components/FilterModal';
import { FilterRow } from '@/components/FilterRow';
import { LiveBadge } from '@/components/LiveBadge';
import { PromoCard } from '@/components/PromoCard';
import { BarraDeBusca } from '@/components/BarraDeBusca';
import { SortModal } from '@/components/SortModal';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { hasFiltrosModalAtivos } from '@/lib/filters';
import { CATEGORIA_TODAS, ICONES_CATEGORIA, TODAS_AS_CATEGORIAS, FILTROS_PADRAO, type FiltrosAtivos } from '@/lib/types';
import { useSavedStore } from '@/store/useSavedStore';
import { usePromocoesFeed } from '@/hooks/usePromocoesFeed';
import { useFeedRecomendado } from '@/hooks/useFeedRecomendado';
import { useRastreamento } from '@/hooks/useRastreamento';

export function HomeScreen() {
  const [filtros, setFiltros] = useState<FiltrosAtivos>(FILTROS_PADRAO);
  const [modalFiltros, setModalFiltros] = useState(false);
  const [modalOrdenar, setModalOrdenar] = useState(false);

  const { promocoes, total, destaques, contagemPorCategoria, loading, refreshing, error, aoVivo, refresh } =
    usePromocoesFeed(filtros);

  const { toggle, isSaved } = useSavedStore();
  const { promocoes: promocoesRec, carregando: carregandoRec, isNovo, recarregar } = useFeedRecomendado(10);
  const { registrar, iniciarView, cancelarView } = useRastreamento();

  const destaque = (promocoesRec[0] ?? destaques[0]) ?? null;
  const idsNovidade = useMemo(
    () => new Set(promocoesRec.filter((p) => p.tipo === 'descoberta').map((p) => p.id)),
    [promocoesRec],
  );
  const categorias = [CATEGORIA_TODAS, ...TODAS_AS_CATEGORIAS];

  function setCategoria(cat: string) {
    setFiltros((prev) => ({ ...prev, categoria: cat, categorias: [] }));
  }

  function toggleFrete() {
    setFiltros((prev) => ({ ...prev, freteGratis: !prev.freteGratis }));
  }

  function aplicarFiltrosModal(
    patch: Pick<FiltrosAtivos, 'precoMin' | 'precoMax' | 'descontoMinimo' | 'categorias'>,
  ) {
    setFiltros((prev) => ({
      ...prev,
      ...patch,
      categoria: patch.categorias.length > 0 ? CATEGORIA_TODAS : prev.categoria,
    }));
  }

  const filtrosModalAtivos = hasFiltrosModalAtivos(filtros);

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
      <BarraDeBusca onSelecionarPromocao={(p) => void Linking.openURL(p.link_afiliado)} />

      {/* Erro */}
      {error ? (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      {/* Featured */}
      {destaque && <FeaturedCard promo={destaque} />}

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
        filtrosAtivos={filtrosModalAtivos}
        onToggleFrete={toggleFrete}
        onOpenFiltros={() => setModalFiltros(true)}
        onOpenOrdenar={() => setModalOrdenar(true)}
      />

      {/* Contagem */}
      <Text style={styles.contagem}>
        <Text style={styles.contagemNum}>{promocoes.length}</Text>
        {' '}{promocoes.length === 1 ? 'promoção' : 'promoções'}
        {filtros.categoria !== CATEGORIA_TODAS ? <Text style={styles.contagemCat}> em {filtros.categoria}</Text> : null}
      </Text>
      <View style={styles.bannerRec}>
        <Text style={styles.bannerTitulo}>Todas as promoções</Text>
        <Text style={styles.bannerSub}>
          {!isNovo
            ? 'Destaque personalizado acima · catálogo completo abaixo'
            : 'Catálogo completo · continue navegando para personalizar'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={promocoes}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing || carregandoRec} onRefresh={() => { refresh(); void recarregar(); }} tintColor={Colors.primary} colors={[Colors.primary]} />}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
            <View
              style={styles.cardWrap}
              onTouchStart={() => iniciarView(item)}
              onTouchEnd={() => cancelarView(item.id)}
            >
              <PromoCard
                promo={item}
                salvo={isSaved(item.id)}
                onToggleSalvo={(p) => { registrar('favorite', p); toggle(p); }}
              />
              {idsNovidade.has(item.id) && (
                <View style={styles.badgeNovidade}>
                  <Text style={styles.badgeText}>NOVIDADE</Text>
                </View>
              )}
            </View>
          )}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            : <View style={styles.empty}><Text style={styles.emptyEmoji}>🔍</Text><Text style={styles.emptyText}>Nenhuma promoção encontrada</Text></View>
        }
        ListFooterComponent={<View style={styles.footer}><Text style={styles.footerText}>Preços podem mudar. Links podem gerar comissão.</Text></View>}
      />

      <FilterModal
        visible={modalFiltros}
        filtros={filtros}
        onClose={() => setModalFiltros(false)}
        onApply={aplicarFiltrosModal}
      />
      <SortModal
        visible={modalOrdenar}
        ordenacao={filtros.ordenacao}
        onClose={() => setModalOrdenar(false)}
        onSelect={(ordenacao) => setFiltros((prev) => ({ ...prev, ordenacao }))}
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
  bannerRec: { paddingTop: 4, paddingBottom: 2 },
  bannerTitulo: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  bannerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badgeNovidade: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#EEF2FF', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 9, color: '#4F46E5', fontWeight: '700' },
});
