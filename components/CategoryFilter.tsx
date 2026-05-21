import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { CATEGORIA_TODAS, ICONES_CATEGORIA, TODAS_AS_CATEGORIAS } from "@/lib/types";

type Props = {
  selecionada: string;
  contagemPorCategoria: Record<string, number>;
  onSelect: (categoria: string) => void;
};

export function CategoryFilter({ selecionada, contagemPorCategoria, onSelect }: Props) {
  const lista = [CATEGORIA_TODAS, ...TODAS_AS_CATEGORIAS];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {lista.map((cat) => {
        const ativa = cat === selecionada;
        const qtd =
          cat === CATEGORIA_TODAS
            ? Object.values(contagemPorCategoria).reduce((a, b) => a + b, 0)
            : (contagemPorCategoria[cat] ?? 0);
        const icone = ICONES_CATEGORIA[cat] ?? "🛍️";

        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            style={[styles.chip, ativa && styles.chipAtiva]}
          >
            <Text style={styles.icone}>{icone}</Text>
            <Text style={[styles.chipText, ativa && styles.chipTextAtiva]}>
              {cat}
            </Text>
            {qtd > 0 && (
              <Text style={[styles.badge, ativa && styles.badgeAtivo]}>
                {qtd}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipAtiva: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  icone: {
    fontSize: 14,
    lineHeight: 18,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#52525b",
  },
  chipTextAtiva: {
    color: "#fff",
    fontWeight: "600",
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717a",
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeAtivo: {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});
