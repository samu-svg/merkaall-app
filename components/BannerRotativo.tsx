import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fmtBRL } from "@/lib/format";
import type { Promocao } from "@/lib/types";

type Props = { promocoes: Promocao[] };

export function BannerRotativo({ promocoes }: Props) {
  const destaques = promocoes.slice(0, 5);
  const [atual, setAtual] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (destaques.length <= 1) return;

    const id = setInterval(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setAtual((prev) => (prev + 1) % destaques.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(id);
  }, [destaques.length, opacity]);

  if (destaques.length === 0) return null;

  const promo = destaques[atual];
  if (!promo) return null;
  const desconto = Math.round(promo.percentual_desconto);

  return (
    <View style={styles.container}>
      {/* Linha laranja topo */}
      <View style={styles.topLine} />

      <Animated.View style={[styles.content, { opacity }]}>
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
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.label}>🔥 Oferta em destaque</Text>
          <Text style={styles.titulo} numberOfLines={2}>
            {promo.titulo}
          </Text>
          <View style={styles.precosRow}>
            <Text style={styles.precoOriginal}>
              {fmtBRL.format(promo.preco_original)}
            </Text>
            <Text style={styles.precoAtual}>
              {fmtBRL.format(promo.preco_desconto)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.botao, pressed && styles.botaoPressed]}
            onPress={() => void Linking.openURL(promo.link_afiliado)}
          >
            <Text style={styles.botaoText}>Ver oferta →</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Indicadores */}
      {destaques.length > 1 && (
        <View style={styles.dots}>
          {destaques.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                Animated.timing(opacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  setAtual(i);
                  Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                });
              }}
              style={[styles.dot, i === atual && styles.dotAtivo]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fff",
    overflow: "hidden",
    marginBottom: 20,
  },
  topLine: {
    height: 2,
    backgroundColor: "#f97316",
    opacity: 0.7,
  },
  content: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
    alignItems: "center",
  },
  imageWrap: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  semImagem: {
    color: "#a1a1aa",
    fontSize: 11,
    textAlign: "center",
  },
  badgeDesconto: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#22c55e",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeDescontoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f97316",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titulo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18181b",
    lineHeight: 20,
  },
  precosRow: {
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
  botao: {
    marginTop: 4,
    backgroundColor: "#f97316",
    borderRadius: 10,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  botaoPressed: {
    backgroundColor: "#ea6e0b",
  },
  botaoText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d4d4d8",
  },
  dotAtivo: {
    width: 20,
    backgroundColor: "#f97316",
  },
});
