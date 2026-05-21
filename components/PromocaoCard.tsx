import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fmtBRL } from "@/lib/format";
import type { Promocao } from "@/lib/types";

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  const rounded = Math.round(rating * 10) / 10;
  return (
    <Text style={styles.ratingText}>★ {rounded.toFixed(1)}</Text>
  );
}

type Props = { promo: Promocao };

export function PromocaoCard({ promo }: Props) {
  const desconto = Math.round(promo.percentual_desconto);
  const economia = promo.preco_original - promo.preco_desconto;

  return (
    <View style={styles.card}>
      {/* Imagem */}
      <View style={styles.imageWrap}>
        {promo.foto_url ? (
          <Image
            source={{ uri: promo.foto_url }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.semImagem}>sem imagem</Text>
        )}

        <View style={styles.badgeDesconto}>
          <Text style={styles.badgeDescontoText}>-{desconto}%</Text>
        </View>

        {promo.avaliacao != null && (
          <View style={styles.badgeRating}>
            <StarRating rating={promo.avaliacao} />
          </View>
        )}
      </View>

      {/* Corpo */}
      <View style={styles.body}>
        <Text style={styles.titulo} numberOfLines={2}>
          {promo.titulo}
        </Text>

        {promo.descricao ? (
          <Text style={styles.descricao} numberOfLines={2}>
            {promo.descricao}
          </Text>
        ) : null}

        <View style={styles.precos}>
          <Text style={styles.precoOriginal}>
            {fmtBRL.format(promo.preco_original)}
          </Text>
          <Text style={styles.precoAtual}>
            {fmtBRL.format(promo.preco_desconto)}
          </Text>
          <Text style={styles.economia}>
            economize {fmtBRL.format(economia)}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.botao, pressed && styles.botaoPressed]}
          onPress={() => void Linking.openURL(promo.link_afiliado)}
        >
          <Text style={styles.botaoText}>Ver oferta →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    overflow: "hidden",
    marginBottom: 16,
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: "#fafafa",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  semImagem: {
    color: "#a1a1aa",
    fontSize: 12,
    textAlign: "center",
  },
  badgeDesconto: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeDescontoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  badgeRating: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratingText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "700",
  },
  body: {
    padding: 16,
    gap: 4,
  },
  titulo: {
    fontSize: 14,
    fontWeight: "600",
    color: "#18181b",
    minHeight: 40,
    lineHeight: 20,
  },
  descricao: {
    fontSize: 12,
    color: "#71717a",
    lineHeight: 17,
  },
  precos: {
    marginTop: 8,
    gap: 2,
  },
  precoOriginal: {
    fontSize: 12,
    color: "#a1a1aa",
    textDecorationLine: "line-through",
  },
  precoAtual: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f97316",
    letterSpacing: -0.5,
  },
  economia: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
  },
  botao: {
    marginTop: 10,
    backgroundColor: "#f97316",
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoPressed: {
    backgroundColor: "#ea6e0b",
  },
  botaoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
