import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BannerRotativo } from "@/components/BannerRotativo";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PromocaoCard } from "@/components/PromocaoCard";
import { usePromocoesFeed } from "@/hooks/usePromocoesFeed";
import { CATEGORIA_TODAS } from "@/lib/types";

export default function App() {
  const {
    promocoes,
    total,
    destaques,
    contagemPorCategoria,
    categoria,
    setCategoria,
    loading,
    refreshing,
    error,
    aoVivo,
    refresh,
  } = usePromocoesFeed();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <FlatList
        data={promocoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PromocaoCard promo={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#f97316"
            colors={["#f97316"]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Marca */}
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>P</Text>
              </View>
              <View style={styles.brandTexts}>
                <Text style={styles.title}>PromoçãoPro</Text>
                <Text style={styles.subtitle}>
                  Ofertas reais do Mercado Livre, curadas por IA
                </Text>
              </View>
            </View>

            {/* Contagem + badge ao vivo */}
            <View style={styles.statsRow}>
              <View style={styles.countBadge}>
                <View style={styles.countDot} />
                <Text style={styles.countText}>
                  {total}{" "}
                  {total === 1 ? "promoção" : "promoções"} disponíveis
                </Text>
              </View>

              <View style={styles.liveBadge}>
                <View style={[styles.liveDot, aoVivo && styles.liveDotOn]} />
                <Text style={styles.liveText}>
                  {aoVivo ? "ao vivo" : "conectando..."}
                </Text>
              </View>
            </View>

            {/* Erro de configuração */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Banner rotativo com top 5 */}
            {destaques.length > 0 && (
              <BannerRotativo promocoes={destaques} />
            )}

            {/* Contagem filtrada + filtros por categoria */}
            <View style={styles.filtroHeader}>
              <Text style={styles.filtroContagem}>
                <Text style={styles.filtroContagemNum}>{promocoes.length}</Text>{" "}
                {promocoes.length === 1 ? "promoção" : "promoções"}
                {categoria !== CATEGORIA_TODAS ? (
                  <Text style={styles.filtroCategoria}> em {categoria}</Text>
                ) : null}
              </Text>
            </View>

            <CategoryFilter
              selecionada={categoria}
              contagemPorCategoria={contagemPorCategoria}
              onSelect={setCategoria}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#f97316" style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>
                {categoria !== CATEGORIA_TODAS
                  ? "Nenhuma promoção ativa nesta categoria."
                  : "Nenhuma promoção ativa."}
              </Text>
              <Text style={styles.emptyHint}>
                {categoria !== CATEGORIA_TODAS
                  ? "Volte daqui a pouco — buscamos novas ofertas a cada 30 minutos."
                  : total === 0 && !error
                    ? "Aguarde o scraper ou puxe para atualizar."
                    : "Tente outra categoria ou atualize a lista."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Os preços e a disponibilidade podem mudar a qualquer momento.
              Confira no site antes de comprar.
            </Text>
            <Text style={styles.footerText}>
              Os links levam ao Mercado Livre e podem gerar comissão para o app.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    gap: 14,
  },

  // Marca
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  brandTexts: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#18181b",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.2)",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f97316",
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#c2410c",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafafa",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d4d4d8",
  },
  liveDotOn: {
    backgroundColor: "#22c55e",
  },
  liveText: {
    fontSize: 11,
    color: "#71717a",
    fontWeight: "500",
  },

  // Erro
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 18,
  },

  // Filtro header
  filtroHeader: {
    marginBottom: -6,
  },
  filtroContagem: {
    fontSize: 14,
    fontWeight: "500",
    color: "#52525b",
  },
  filtroContagemNum: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18181b",
  },
  filtroCategoria: {
    color: "#f97316",
    fontWeight: "600",
  },

  // Vazio
  loader: {
    marginTop: 48,
  },
  empty: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#52525b",
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 18,
  },

  // Rodapé
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 16,
  },
});
