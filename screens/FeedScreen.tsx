import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Settings2 } from 'lucide-react-native';

import { CategoryPickerModal } from '@/components/CategoryPickerModal';
import { CategoryPicker, isCategorySelectionValid } from '@/components/CategoryPicker';
import { LiveBadge } from '@/components/LiveBadge';
import { PromoBubble } from '@/components/feed/PromoBubble';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import {
  type PromocaoFeedEnriquecida,
  useFeedPersonalizado,
} from '@/hooks/useFeedPersonalizado';
import { useRastreamento } from '@/hooks/useRastreamento';
import { seedCategoryPreferences } from '@/lib/feedPrefs';
import { ICONES_CATEGORIA } from '@/lib/types';
import {
  FEED_CATEGORIAS_MAX,
  FEED_CATEGORIAS_MIN,
  useFeedPrefsStore,
} from '@/store/useFeedPrefsStore';
import { usePromoDetailStore } from '@/store/usePromoDetailStore';
import { useSavedStore } from '@/store/useSavedStore';

export function FeedScreen() {
  const {
    categorias,
    secoes,
    descoberta,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    aoVivo,
    erro,
    refresh,
    loadMore,
  } = useFeedPersonalizado();

  const setCategorias = useFeedPrefsStore((s) => s.setCategorias);
  const { toggle, isSaved } = useSavedStore();
  const { registrar } = useRastreamento();
  const openDetail = usePromoDetailStore((s) => s.open);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [draftCats, setDraftCats] = useState<Set<string>>(new Set(categorias));
  const [setupCats, setSetupCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDraftCats(new Set(categorias));
  }, [categorias]);

  const tituloCategorias = useMemo(() => {
    if (categorias.length === 0) return 'Escolha seus interesses';
    if (categorias.length <= 2) return categorias.join(' · ');
    return `${categorias.slice(0, 2).join(', ')} +${categorias.length - 2}`;
  }, [categorias]);

  const handleOpenDetail = useCallback(
    (promo: PromocaoFeedEnriquecida) => {
      void registrar('click', promo);
      openDetail(promo);
    },
    [openDetail, registrar],
  );

  const handleSavePicker = useCallback(async () => {
    const cats = [...draftCats];
    await setCategorias(cats);
    await seedCategoryPreferences(cats);
    setPickerVisible(false);
    refresh();
  }, [draftCats, refresh, setCategorias]);

  const handleSaveSetup = useCallback(async () => {
    if (!isCategorySelectionValid(setupCats, FEED_CATEGORIAS_MIN, FEED_CATEGORIAS_MAX)) return;
    const cats = [...setupCats];
    await setCategorias(cats);
    await seedCategoryPreferences(cats);
    refresh();
  }, [setupCats, refresh, setCategorias]);

  const renderItem = useCallback(
    ({ item }: { item: PromocaoFeedEnriquecida }) => (
      <PromoBubble
        promo={item}
        salvo={isSaved(item.id)}
        onToggleSalvo={toggle}
        onOpenDetail={handleOpenDetail}
      />
    ),
    [handleOpenDetail, isSaved, toggle],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { label: string } }) => (
      <View style={styles.daySeparator}>
        <Text style={styles.daySeparatorText}>{section.label}</Text>
      </View>
    ),
    [],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.discoveryWrap}>
        {descoberta.length > 0 ? (
          <>
            <Text style={styles.discoveryTitle}>Descobrir</Text>
            <Text style={styles.discoverySub}>
              Ofertas de outras categorias que você pode gostar
            </Text>
            {descoberta.map((promo) => (
              <PromoBubble
                key={promo.id}
                promo={promo}
                salvo={isSaved(promo.id)}
                onToggleSalvo={toggle}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </>
        ) : null}
        {loadingMore ? (
          <ActivityIndicator color={Colors.primary} style={styles.loadMore} />
        ) : null}
      </View>
    ),
    [descoberta, handleOpenDetail, isSaved, loadingMore, toggle],
  );

  if (categorias.length === 0) {
    return (
      <Screen>
        <View style={styles.setupWrap}>
          <Text style={styles.setupTitle}>Monte seu feed</Text>
          <Text style={styles.setupSub}>
            Escolha de {FEED_CATEGORIAS_MIN} a {FEED_CATEGORIAS_MAX} categorias para receber
            promoções como em um grupo.
          </Text>
          <CategoryPicker
            selecionadas={setupCats}
            onChange={setSetupCats}
            min={FEED_CATEGORIAS_MIN}
            max={FEED_CATEGORIAS_MAX}
          />
          <Pressable
            style={[
              styles.setupBtn,
              !isCategorySelectionValid(setupCats, FEED_CATEGORIAS_MIN, FEED_CATEGORIAS_MAX) &&
                styles.setupBtnDisabled,
            ]}
            onPress={() => void handleSaveSetup()}
            disabled={
              !isCategorySelectionValid(setupCats, FEED_CATEGORIAS_MIN, FEED_CATEGORIAS_MAX)
            }
          >
            <Text style={styles.setupBtnText}>Começar</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.groupHeader}>
        <View style={styles.groupHeaderTop}>
          <View style={styles.groupHeaderText}>
            <Text style={styles.groupTitle}>Promoções Merkaall</Text>
            <Text style={styles.groupSub} numberOfLines={1}>
              {tituloCategorias}
            </Text>
          </View>
          <LiveBadge aoVivo={aoVivo} />
        </View>

        <View style={styles.chipsRow}>
          {categorias.map((cat) => (
            <View key={cat} style={styles.chipResumo}>
              <Text style={styles.chipResumoText}>
                {ICONES_CATEGORIA[cat] ?? '🏷️'} {cat}
              </Text>
            </View>
          ))}
          <Pressable
            style={styles.editBtn}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Editar interesses do feed"
          >
            <Settings2 size={16} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      {erro ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : null}

      {loading && secoes.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : secoes.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Nenhuma promoção ainda</Text>
          <Text style={styles.emptySub}>
            Quando surgirem ofertas nas suas categorias, elas aparecerão aqui em tempo real.
          </Text>
          <Pressable style={styles.editLink} onPress={() => setPickerVisible(true)}>
            <Text style={styles.editLinkText}>Ampliar categorias</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={secoes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          inverted
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={() => {
            if (hasMore) void loadMore();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={listHeader}
        />
      )}

      <CategoryPickerModal
        visible={pickerVisible}
        selecionadas={draftCats}
        onChange={setDraftCats}
        onSave={() => void handleSavePicker()}
        onClose={() => setPickerVisible(false)}
        min={FEED_CATEGORIAS_MIN}
        max={FEED_CATEGORIAS_MAX}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  groupHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  groupHeaderText: { flex: 1 },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  groupSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chipResumo: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.chip,
  },
  chipResumoText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.primaryText,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySeparator: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  daySeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.chip,
    overflow: 'hidden',
  },
  listContent: {
    paddingVertical: Spacing.sm,
    flexGrow: 1,
  },
  discoveryWrap: {
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  discoveryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
  },
  discoverySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  loadMore: { paddingVertical: Spacing.md },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  editLink: { marginTop: Spacing.md },
  editLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  errorBox: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.cardSm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: { color: Colors.danger, fontSize: 13 },
  setupWrap: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  setupSub: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  setupBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  setupBtnDisabled: { opacity: 0.45 },
  setupBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
