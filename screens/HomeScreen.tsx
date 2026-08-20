import { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BannerRotativo } from '@/components/BannerRotativo';
import { BarraDeBusca } from '@/components/BarraDeBusca';
import { CategoryChip } from '@/components/CategoryChip';
import { CategoryTab } from '@/components/CategoryTab';
import { FilterModal } from '@/components/FilterModal';
import { FilterRow } from '@/components/FilterRow';
import { LiveBadge } from '@/components/LiveBadge';
import { PromoCard } from '@/components/PromoCard';
import { SortModal } from '@/components/SortModal';
import { AppFooter } from '@/components/AppFooter';
import { BrandLogo } from '@/components/BrandLogo';
import { Colors, type ColorPalette } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { useBuscaInteligente } from '@/hooks/useBuscaInteligente';
import { useFeedRecomendado } from '@/hooks/useFeedRecomendado';
import { usePromocoesFeed } from '@/hooks/usePromocoesFeed';
import { useRastreamento } from '@/hooks/useRastreamento';
import { useResponsive } from '@/hooks/useResponsive';
import { promocaoMatchesFiltros } from '@/lib/feedQuery';
import { hasFiltrosModalAtivos } from '@/lib/filters';
import { isExpiringSoon } from '@/lib/promoFormat';
import { ordenarResultadosBusca } from '@/lib/searchRanking';
import {
  CATEGORIA_TODAS,
  FILTROS_PADRAO,
  LOJA_TODAS,
  LOJAS_FEED,
  TODAS_AS_CATEGORIAS,
  type FiltrosAtivos,
} from '@/lib/types';
import { usePromoDetailStore } from '@/store/usePromoDetailStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { useNotificationsUiStore } from '@/store/useNotificationsUiStore';
import { useSavedStore } from '@/store/useSavedStore';

function labelCategoria(cat: string): string {
  return cat === CATEGORIA_TODAS ? 'Tudo' : cat;
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    headerFixo: {
      backgroundColor: c.background,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xs,
      zIndex: 10,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    brandMark: {
      flexShrink: 0,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    bellWrap: {
      position: 'relative',
      padding: 2,
    },
    bellBadge: {
      position: 'absolute',
      top: -4,
      right: -6,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    bellBadgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '700',
    },
    categoriasRow: {
      paddingBottom: Spacing.xs,
    },
    listaFlex: { flex: 1 },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
    headerWrap: { gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    lojas: { gap: Spacing.sm, paddingVertical: Spacing.xs },
    contagemParcial: { color: c.textTertiary },
    contagem: { fontSize: 13, fontWeight: '400', color: c.textSecondary, marginTop: Spacing.xs },
    contagemNum: { fontWeight: '500', color: c.textPrimary },
    contagemCat: { color: c.primary },
    row: { gap: Spacing.sm },
    cardWrap: { flex: 1 },
    loader: { marginTop: 48 },
    empty: { padding: 40, alignItems: 'center', gap: Spacing.sm },
    emptyEmoji: { fontSize: 32 },
    emptyText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    emptyDica: { fontSize: 13, color: c.textTertiary, textAlign: 'center' },
    errorBox: {
      backgroundColor: c.dangerLight,
      borderRadius: Radius.cardSm,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: Spacing.sm,
    },
    errorBoxHeader: {
      backgroundColor: c.dangerLight,
      borderRadius: Radius.cardSm,
      padding: Spacing.sm,
      marginBottom: Spacing.xs,
      gap: Spacing.sm,
    },
    errorText: { color: c.danger, fontSize: 13 },
    retryBtn: {
      alignSelf: 'flex-start',
      backgroundColor: c.surface,
      borderRadius: Radius.chip,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderWidth: 1,
      borderColor: c.border,
    },
    retryText: { color: c.primary, fontSize: 13, fontWeight: '600' },
    bannerRec: { paddingTop: 4, paddingBottom: 2 },
    bannerTitulo: { fontSize: 17, fontWeight: '600', color: c.textPrimary },
    bannerSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    badgeNovidade: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: c.unreadBg,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    badgeText: { fontSize: 9, color: c.primary, fontWeight: '700' },
  });
}

const styles = createStyles(Colors);

export function HomeScreen() {
  const { numColumns, contentMaxWidth } = useResponsive();
  const [filtros, setFiltros] = useState<FiltrosAtivos>(FILTROS_PADRAO);
  const [modalFiltros, setModalFiltros] = useState(false);
  const [modalOrdenar, setModalOrdenar] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroExpiraEmBreve, setFiltroExpiraEmBreve] = useState(false);

  const { promocoes, total, destaques, loading, loadingMore, refreshing, error, aoVivo, refresh, loadMore } =
    usePromocoesFeed(filtros);

  const {
    promocoes: promocoesBusca,
    carregando: carregandoBusca,
    erro: erroBusca,
    termosExpandidos,
    buscar,
    limpar: limparBusca,
  } = useBuscaInteligente();

  const { toggle, isSaved } = useSavedStore();
  const { promocoes: promocoesRec, carregando: carregandoRec, isNovo, recarregar } = useFeedRecomendado(10);
  const { registrar } = useRastreamento();
  const openDetail = usePromoDetailStore((s) => s.open);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const openNotifications = useNotificationsUiStore((s) => s.open);

  const handleOpenNotifications = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openNotifications();
  }, [openNotifications]);

  const emBusca = termoBusca.trim().length >= 2;

  const promocoesBuscaFiltradas = useMemo(() => {
    const filtradas = promocoesBusca.filter((p) => promocaoMatchesFiltros(p, filtros));
    return ordenarResultadosBusca(termoBusca.trim(), filtradas, filtros.ordenacao);
  }, [promocoesBusca, filtros, termoBusca]);

  const promocoesBase = emBusca ? promocoesBuscaFiltradas : promocoes;

  const promocoesExibidas = useMemo(() => {
    if (!filtroExpiraEmBreve || emBusca) return promocoesBase;
    return promocoesBase.filter((p) => isExpiringSoon(p.expires_at));
  }, [promocoesBase, filtroExpiraEmBreve, emBusca]);

  const loadingExibido = emBusca ? carregandoBusca : loading;
  const erroExibido = emBusca ? erroBusca : error;
  const totalExibido = emBusca
    ? promocoesBuscaFiltradas.length
    : filtroExpiraEmBreve
      ? promocoesExibidas.length
      : total;

  const bannerDestaques = useMemo(() => {
    if (emBusca) return [];
    const fonte = promocoesRec.length > 0 ? promocoesRec : destaques;
    return fonte.slice(0, 5);
  }, [emBusca, promocoesRec, destaques]);

  const idsNovidade = useMemo(
    () => new Set(promocoesRec.filter((p) => p.tipo === 'descoberta').map((p) => p.id)),
    [promocoesRec],
  );

  const lojas = [LOJA_TODAS, ...LOJAS_FEED];
  const categorias = [CATEGORIA_TODAS, ...TODAS_AS_CATEGORIAS];

  const handleTermoBusca = useCallback(
    (valor: string) => {
      setTermoBusca(valor);
      buscar(valor);
    },
    [buscar],
  );

  const handleCancelarBusca = useCallback(() => {
    setTermoBusca('');
    limparBusca();
  }, [limparBusca]);

  const handleRefresh = useCallback(() => {
    if (emBusca) {
      buscar(termoBusca);
      return;
    }
    refresh();
    void recarregar();
  }, [emBusca, termoBusca, buscar, refresh, recarregar]);

  function setLoja(loja: string) {
    setFiltros((prev) => ({ ...prev, loja }));
  }

  function setCategoria(cat: string) {
    setFiltros((prev) => ({ ...prev, categoria: cat, categorias: [] }));
  }

  function toggleFrete() {
    setFiltros((prev) => ({ ...prev, freteGratis: !prev.freteGratis }));
  }

  function toggleExpiraEmBreve() {
    setFiltroExpiraEmBreve((prev) => !prev);
  }

  function aplicarFiltrosModal(
    patch: Pick<FiltrosAtivos, 'precoMin' | 'precoMax' | 'descontoMaximo' | 'categorias'>,
  ) {
    setFiltros((prev) => ({
      ...prev,
      ...patch,
      categoria: patch.categorias.length > 0 ? CATEGORIA_TODAS : prev.categoria,
    }));
  }

  const filtrosModalAtivos = hasFiltrosModalAtivos(filtros);

  const errorRetryBox = erroExibido ? (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{erroExibido}</Text>
      <Pressable
        style={styles.retryBtn}
        onPress={handleRefresh}
        accessibilityRole="button"
        accessibilityLabel="Tentar de novo"
      >
        <Text style={styles.retryText}>Tentar de novo</Text>
      </Pressable>
    </View>
  ) : null;

  const headerScroll = (
    <View style={styles.headerWrap}>
      {!termoBusca ? errorRetryBox : null}

      {!emBusca && bannerDestaques.length > 0 ? (
        <BannerRotativo promocoes={bannerDestaques} onOpenDetail={openDetail} />
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lojas}>
        {lojas.map((loja) => (
          <CategoryChip
            key={loja}
            label={loja}
            ativa={filtros.loja === loja}
            onPress={() => setLoja(loja)}
          />
        ))}
      </ScrollView>

      <FilterRow
        freteGratis={filtros.freteGratis}
        expiraEmBreve={filtroExpiraEmBreve}
        filtrosAtivos={filtrosModalAtivos}
        onToggleFrete={toggleFrete}
        onToggleExpira={toggleExpiraEmBreve}
        onOpenFiltros={() => setModalFiltros(true)}
        onOpenOrdenar={() => setModalOrdenar(true)}
      />

      <Text style={styles.contagem}>
        <Text style={styles.contagemNum}>{totalExibido}</Text>
        {' '}
        {totalExibido === 1 ? 'promoção' : 'promoções'}
        {emBusca ? (
          <Text style={styles.contagemCat}> para "{termoBusca.trim()}"</Text>
        ) : (
          <>
            {filtros.loja !== LOJA_TODAS ? <Text style={styles.contagemCat}> · {filtros.loja}</Text> : null}
            {filtros.categoria !== CATEGORIA_TODAS ? (
              <Text style={styles.contagemCat}> em {filtros.categoria}</Text>
            ) : null}
            {filtroExpiraEmBreve ? (
              <Text style={styles.contagemCat}> · expira em breve</Text>
            ) : null}
            {!filtroExpiraEmBreve && promocoes.length < total ? (
              <Text style={styles.contagemParcial}> · mostrando {promocoes.length}</Text>
            ) : null}
            {filtroExpiraEmBreve ? (
              <Text style={styles.contagemParcial}> · filtro local nos itens carregados</Text>
            ) : null}
          </>
        )}
      </Text>

      <View style={styles.bannerRec}>
        <Text style={styles.bannerTitulo}>{emBusca ? 'Resultados da busca' : 'Todas as promoções'}</Text>
        <Text style={styles.bannerSub}>
          {emBusca
            ? 'Toque no card para ver detalhes e abrir a loja'
            : !isNovo
              ? 'Destaques personalizados acima · catálogo completo abaixo'
              : 'Catálogo completo · continue navegando para personalizar'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.headerFixo}>
        <View style={styles.topRow}>
          <BrandLogo variant="horizontal" size={34} style={styles.brandMark} />

          <BarraDeBusca
            variant="header"
            value={termoBusca}
            onChangeText={handleTermoBusca}
            onCancel={handleCancelarBusca}
            carregando={carregandoBusca}
            erro={erroBusca}
            termosExpandidos={termosExpandidos}
          />

          <View style={styles.headerActions}>
            <LiveBadge aoVivo={aoVivo} />
            <Pressable
              style={styles.bellWrap}
              onPress={handleOpenNotifications}
              accessibilityRole="button"
              accessibilityLabel={
                unreadCount > 0
                  ? `Notificações, ${unreadCount} não lidas`
                  : 'Notificações'
              }
            >
              <Bell size={22} color={Colors.textSecondary} strokeWidth={1.8} />
              {unreadCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasRow}
        >
          {categorias.map((cat) => (
            <CategoryTab
              key={cat}
              label={labelCategoria(cat)}
              ativa={filtros.categoria === cat}
              onPress={() => setCategoria(cat)}
            />
          ))}
        </ScrollView>

        {erroExibido && termoBusca ? (
          <View style={styles.errorBoxHeader}>
            <Text style={styles.errorText}>{erroExibido}</Text>
            <Pressable
              style={styles.retryBtn}
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel="Tentar de novo"
            >
              <Text style={styles.retryText}>Tentar de novo</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <FlatList
        key={`cols-${numColumns}`}
        style={styles.listaFlex}
        data={promocoesExibidas}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.list,
          { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={emBusca ? carregandoBusca : refreshing || carregandoRec}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={headerScroll}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <PromoCard
              promo={item}
              salvo={isSaved(item.id)}
              onOpenDetail={openDetail}
              onToggleSalvo={(p) => {
                registrar('favorite', p);
                toggle(p);
              }}
            />
            {!emBusca && idsNovidade.has(item.id) && (
              <View style={styles.badgeNovidade}>
                <Text style={styles.badgeText}>NOVIDADE</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          loadingExibido ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>
                {emBusca
                  ? `Nenhuma promoção encontrada para "${termoBusca.trim()}"`
                  : filtroExpiraEmBreve
                    ? 'Nenhuma promoção expirando em breve nos itens carregados'
                    : 'Nenhuma promoção encontrada'}
              </Text>
              {emBusca ? (
                <Text style={styles.emptyDica}>Tente termos mais gerais como "celular" ou "tv"</Text>
              ) : null}
            </View>
          )
        }
        onEndReached={emBusca || filtroExpiraEmBreve ? undefined : () => void loadMore()}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          <AppFooter>
            {!emBusca && loadingMore ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : null}
          </AppFooter>
        }
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
