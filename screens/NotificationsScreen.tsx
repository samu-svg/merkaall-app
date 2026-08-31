import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Bell, ChevronLeft, Sparkles, Tag, TrendingDown } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { Colors, type ColorPalette } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { formatRelativeCriadaEm } from '@/lib/promoFormat';
import { buscarPromocaoPorId } from '@/lib/supabase';
import type { Notificacao, TipoNotificacao } from '@/lib/types';
import { useNotificationsUiStore } from '@/store/useNotificationsUiStore';
import { usePromoDetailStore } from '@/store/usePromoDetailStore';

type Props = {
  onClose: () => void;
};

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      gap: Spacing.sm,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: Radius.chip,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: '500',
      color: c.textPrimary,
    },
    markAllBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    markAllText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.primary,
    },
    headerSpacer: { width: 72 },
    errorBox: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      backgroundColor: c.dangerLight,
      borderRadius: Radius.cardSm,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
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
    list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
    listEmpty: { flexGrow: 1, paddingHorizontal: Spacing.lg },
    loader: { marginTop: 48 },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      padding: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: Radius.cardSm,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    itemUnread: {
      backgroundColor: c.unreadBg,
      borderColor: c.unreadBorder,
    },
    itemPressed: { opacity: 0.85 },
    itemIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.chip,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemBody: { flex: 1, gap: 4 },
    itemTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    itemTitulo: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: c.textPrimary,
    },
    itemTempo: {
      fontSize: 11,
      color: c.textTertiary,
    },
    itemCorpo: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 18,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primary,
      marginTop: 6,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      gap: Spacing.sm,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: c.textPrimary,
      textAlign: 'center',
    },
    emptyHint: {
      fontSize: 13,
      color: c.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
}

const styles = createStyles(Colors);

function IconeTipo({ tipo }: { tipo: TipoNotificacao }) {
  const props = { size: 20, strokeWidth: 1.8 };
  switch (tipo) {
    case 'nova_promo':
      return <Sparkles {...props} color={Colors.primary} />;
    case 'queda_preco':
      return <TrendingDown {...props} color="#059669" />;
    case 'alerta':
      return <Bell {...props} color="#D97706" />;
    default:
      return <Tag {...props} color={Colors.textSecondary} />;
  }
}

function NotificacaoItem({
  item,
  onPress,
  styles: itemStyles,
}: {
  item: Notificacao;
  onPress: (item: Notificacao) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        itemStyles.item,
        !item.lida && itemStyles.itemUnread,
        pressed && itemStyles.itemPressed,
      ]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.titulo}. ${item.corpo}. ${formatRelativeCriadaEm(item.criadoEm)}`}
    >
      <View style={itemStyles.itemIcon}>
        <IconeTipo tipo={item.tipo} />
      </View>
      <View style={itemStyles.itemBody}>
        <View style={itemStyles.itemTop}>
          <Text style={itemStyles.itemTitulo} numberOfLines={1}>
            {item.titulo}
          </Text>
          <Text style={itemStyles.itemTempo}>{formatRelativeCriadaEm(item.criadoEm)}</Text>
        </View>
        <Text style={itemStyles.itemCorpo} numberOfLines={2}>
          {item.corpo}
        </Text>
      </View>
      {!item.lida ? <View style={itemStyles.unreadDot} /> : null}
    </Pressable>
  );
}

export function NotificationsScreen({ onClose }: Props) {
  const visible = useNotificationsUiStore((s) => s.visible);
  const openDetail = usePromoDetailStore((s) => s.open);
  const closeNotifications = useNotificationsUiStore((s) => s.close);
  const { lista, carregando, erro, naoLidas, recarregar, marcarLida, marcarTodasLidas } =
    useNotificacoes(visible);

  const handleItemPress = useCallback(
    async (item: Notificacao) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void marcarLida(item.id);

      if (!item.promocaoId) return;

      const { data } = await buscarPromocaoPorId(item.promocaoId);
      if (data) {
        closeNotifications();
        openDetail(data);
      }
    },
    [marcarLida, closeNotifications, openDetail],
  );

  const handleMarcarTodas = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void marcarTodasLidas();
  }, [marcarTodasLidas]);

  const empty = (
    <View style={styles.empty}>
      <Bell size={36} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>Nenhuma notificação ainda</Text>
      <Text style={styles.emptyHint}>
        Quando houver novas promoções, quedas de preço ou alertas, elas aparecerão aqui.
      </Text>
    </View>
  );

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Fechar notificações"
        >
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Notificações</Text>
        {naoLidas > 0 ? (
          <Pressable
            onPress={handleMarcarTodas}
            style={styles.markAllBtn}
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como lidas"
          >
            <Text style={styles.markAllText}>Marcar lidas</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {erro ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{erro}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => void recarregar()}
            accessibilityRole="button"
            accessibilityLabel="Tentar de novo"
          >
            <Text style={styles.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        contentContainerStyle={lista.length === 0 ? styles.listEmpty : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={carregando}
            onRefresh={() => void recarregar()}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          carregando ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : (
            empty
          )
        }
        renderItem={({ item }) => (
          <NotificacaoItem
            item={item}
            onPress={handleItemPress}
            styles={styles}
          />
        )}
      />
    </Screen>
  );
}
