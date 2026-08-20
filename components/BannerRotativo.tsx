import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { fmtBRL } from '@/lib/format';
import { getPromoCapa } from '@/lib/promoFormat';
import { LojaBadge } from '@/components/LojaBadge';
import { Colors, type ColorPalette } from '@/constants/colors';
import type { Promocao } from '@/lib/types';

type Props = {
  promocoes: Promocao[];
  onOpenDetail?: (promo: Promocao) => void;
};

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: 'hidden',
      marginBottom: 4,
    },
    topLine: {
      height: 2,
      backgroundColor: c.primary,
      opacity: 0.7,
    },
    content: {
      flexDirection: 'row',
      padding: 16,
      gap: 16,
      alignItems: 'center',
    },
    imageWrap: {
      width: 120,
      height: 120,
      borderRadius: 12,
      backgroundColor: c.background,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    semImagem: {
      color: c.textTertiary,
      fontSize: 11,
      textAlign: 'center',
    },
    badgeDesconto: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: c.success,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    badgeDescontoText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    info: {
      flex: 1,
      gap: 6,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: c.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    titulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textPrimary,
      lineHeight: 20,
    },
    precosRow: {
      gap: 2,
    },
    precoOriginal: {
      fontSize: 12,
      color: c.textTertiary,
      textDecorationLine: 'line-through',
    },
    precoAtual: {
      fontSize: 22,
      fontWeight: '800',
      color: c.primary,
      letterSpacing: -0.5,
    },
    botao: {
      marginTop: 4,
      backgroundColor: c.primary,
      borderRadius: 10,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    botaoPressed: {
      opacity: 0.85,
    },
    botaoText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      paddingBottom: 12,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.textTertiary,
    },
    dotAtivo: {
      width: 20,
      backgroundColor: c.primary,
    },
  });
}

const styles = createStyles(Colors);

export function BannerRotativo({ promocoes, onOpenDetail }: Props) {
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
  const capa = getPromoCapa(promo);

  function handleOpenDetail() {
    if (!onOpenDetail) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenDetail(promo);
  }

  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={styles.topLine} />

      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.imageWrap}>
          {capa ? (
            <Image
              source={{ uri: capa }}
              style={styles.image}
              contentFit="contain"
              transition={150}
            />
          ) : (
            <Text style={styles.semImagem}>sem imagem</Text>
          )}
          <View style={styles.badgeDesconto}>
            <Text style={styles.badgeDescontoText}>-{desconto}%</Text>
          </View>
        </View>

        <View style={styles.info}>
          <LojaBadge promo={promo} />
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
            onPress={handleOpenDetail}
            disabled={!onOpenDetail}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalhes de ${promo.titulo}`}
          >
            <Text style={styles.botaoText}>Ver detalhes →</Text>
          </Pressable>
        </View>
      </Animated.View>

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
              accessibilityRole="button"
              accessibilityLabel={`Destaque ${i + 1} de ${destaques.length}`}
              accessibilityState={{ selected: i === atual }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
