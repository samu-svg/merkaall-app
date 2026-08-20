import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/Toast';
import { DescontoSuspeitoBanner } from '@/components/detail/DescontoSuspeitoBanner';
import { AffiliateNotice } from '@/components/detail/AffiliateNotice';
import { DescriptionSection } from '@/components/detail/DescriptionSection';
import { PromoDetailFooter } from '@/components/detail/PromoDetailFooter';
import { PromoDetailHeader } from '@/components/detail/PromoDetailHeader';
import { PromoImageGallery } from '@/components/detail/PromoImageGallery';
import { PromoPriceCard } from '@/components/detail/PromoPriceCard';
import { PromoSimilaresRow } from '@/components/detail/PromoSimilaresRow';
import { TrustChipsRow } from '@/components/detail/TrustChipsRow';
import { UrgencyBanner } from '@/components/detail/UrgencyBanner';
import { LojaBadge } from '@/components/LojaBadge';
import { Colors, type ColorPalette } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { usePromoDetailRefresh } from '@/hooks/usePromoDetailRefresh';
import { usePromoSimilares } from '@/hooks/usePromoSimilares';
import { useRastreamento } from '@/hooks/useRastreamento';
import { copyPromoLink, getPromoShareUrl } from '@/lib/share';
import { getLojaNome } from '@/lib/lojas';
import { maybeRequestReview } from '@/lib/review';
import { isDescontoSuspeito } from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';
import { usePromoDetailStore } from '@/store/usePromoDetailStore';
import { useSavedStore } from '@/store/useSavedStore';
import { useAlertsStore } from '@/store/useAlertsStore';

type Props = {
  onClose: () => void;
};

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    categoriaChip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.chip,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
    },
    categoriaText: { fontSize: 12, color: c.textSecondary },
    titulo: {
      fontSize: 20,
      fontWeight: '600',
      color: c.textPrimary,
      lineHeight: 26,
    },
    disclaimer: {
      fontSize: 11,
      color: c.textTertiary,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: Spacing.lg,
    },
  });
}

const styles = createStyles(Colors);

export function PromoDetailScreen({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const promo = usePromoDetailStore((s) => s.promo);
  const open = usePromoDetailStore((s) => s.open);
  const { registrar } = useRastreamento();
  const { toggle, isSaved } = useSavedStore();
  const alertas = useAlertsStore((s) => s.alertas);
  const adicionarAlerta = useAlertsStore((s) => s.adicionar);
  const [toast, setToast] = useState<string | null>(null);

  const { refreshing, unavailable, dismissUnavailable } = usePromoDetailRefresh(promo?.id);
  const { similares, carregando: carregandoSimilares } = usePromoSimilares(promo);

  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!promo) return;
    void registrar('view', promo);
  }, [promo?.id, registrar]);

  useEffect(() => {
    if (unavailable) {
      Alert.alert('Oferta indisponível', 'Esta promoção não está mais ativa.', [
        { text: 'OK', onPress: dismissUnavailable },
      ]);
    }
  }, [unavailable, dismissUnavailable]);

  if (!promo) return null;

  const salvo = isSaved(promo.id);
  const descontoSuspeito = isDescontoSuspeito(promo);
  const lojaNome = getLojaNome(promo);
  const monitorando = alertas.some(
    (a) =>
      a.titulo.trim().toLowerCase() === promo.titulo.trim().toLowerCase() &&
      a.precoMaximo === promo.preco_desconto,
  );

  function handleSalvar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void registrar('favorite', promo!);
    toggle(promo!);
    setToast(salvo ? 'Removido dos salvos' : 'Salvo nos favoritos');
  }

  function handleOpenOffer() {
    Alert.alert(
      `Abrir na ${lojaNome}`,
      'Você será redirecionado para o site da loja. O preço e a disponibilidade podem ser diferentes. Este é um link de afiliado e pode gerar comissão para o Merkaall, sem custo para você.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            void registrar('open_link', promo!);
            void maybeRequestReview('open_link');
            void Linking.openURL(promo!.link_afiliado);
          },
        },
      ],
    );
  }

  async function handleCopyLink() {
    await copyPromoLink(getPromoShareUrl(promo!));
    setToast('Link copiado');
  }

  function handleMonitorPrice() {
    if (monitorando) {
      setToast('Você já monitora este preço');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    adicionarAlerta({
      titulo: promo!.titulo,
      precoMaximo: promo!.preco_desconto,
      descontoMinimo: Math.round(promo!.percentual_desconto) || 0,
      ativo: true,
    });
    setToast('Monitorando preço');
  }

  function handleSelectSimilar(outra: Promocao) {
    open(outra);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PromoDetailHeader
        promo={promo}
        salvo={salvo}
        refreshing={refreshing}
        onClose={onClose}
        onSave={handleSalvar}
        onShareCopied={() => setToast('Link copiado')}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Spacing.lg + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {promo.expires_at ? <UrgencyBanner expiresAt={promo.expires_at} /> : null}
        {descontoSuspeito ? <DescontoSuspeitoBanner /> : null}

        <PromoImageGallery promo={promo} horizontalPadding={Spacing.lg} />

        <View style={styles.metaRow}>
          <LojaBadge promo={promo} />
          {promo.categoria ? (
            <View style={styles.categoriaChip}>
              <Text style={styles.categoriaText}>{promo.categoria}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.titulo}>{promo.titulo}</Text>

        <PromoPriceCard promo={promo} />
        <AffiliateNotice />

        <PromoDetailFooter
          lojaNome={lojaNome}
          salvo={salvo}
          onSave={handleSalvar}
          onOpenOffer={handleOpenOffer}
          onCopyLink={() => void handleCopyLink()}
          onMonitorPrice={handleMonitorPrice}
          monitorando={monitorando}
        />

        <TrustChipsRow promo={promo} />
        <DescriptionSection promo={promo} />

        <PromoSimilaresRow
          similares={similares}
          carregando={carregandoSimilares}
          onSelect={handleSelectSimilar}
        />

        <Text style={styles.disclaimer}>
          Preços e disponibilidade podem mudar a qualquer momento.{'\n'}
          Links podem gerar comissão para o app.
        </Text>
      </ScrollView>

      <Toast message={toast} onHide={hideToast} />
    </View>
  );
}
