import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItem,
} from 'react-native';
import { Image } from 'expo-image';
import { Package } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { getPromoFotos } from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';

type Props = {
  promo: Pick<Promocao, 'foto_url' | 'fotos_urls' | 'percentual_desconto'>;
  horizontalPadding?: number;
};

export function PromoImageGallery({ promo, horizontalPadding = Spacing.lg }: Props) {
  const fotos = useMemo(() => getPromoFotos(promo), [promo.foto_url, promo.fotos_urls]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const { width } = useWindowDimensions();
  const pageWidth = width - horizontalPadding * 2;
  const heroHeight = Math.min(Math.round(pageWidth * 0.9), 420);
  const desconto = Math.round(promo.percentual_desconto);
  const multi = fotos.length > 1;

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.min(Math.max(0, index), fotos.length - 1));
  }

  const renderItem: ListRenderItem<string> = ({ item }) => (
    <View style={[styles.slide, { width: pageWidth, height: heroHeight }]}>
      <Image source={{ uri: item }} style={styles.image} contentFit="contain" transition={200} />
    </View>
  );

  if (fotos.length === 0) {
    return (
      <View style={styles.hero}>
        <View style={[styles.placeholder, { height: heroHeight }]}>
          <Package size={48} color={Colors.textTertiary} />
          <Text style={styles.placeholderText}>Sem imagem</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>-{desconto}%</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <FlatList
        ref={listRef}
        data={fotos}
        renderItem={renderItem}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, index) => ({
          length: pageWidth,
          offset: pageWidth * index,
          index,
        })}
        onScrollToIndexFailed={() => {
          listRef.current?.scrollToOffset({ offset: activeIndex * pageWidth, animated: true });
        }}
      />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>-{desconto}%</Text>
      </View>

      {multi ? (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {activeIndex + 1}/{fotos.length}
          </Text>
        </View>
      ) : null}

      {multi ? (
        <View style={styles.dots}>
          {fotos.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}

      {multi && fotos.length <= 6 ? (
        <View style={styles.thumbs}>
          {fotos.map((uri, i) => (
            <Pressable
              key={`thumb-${uri}-${i}`}
              onPress={() => {
                setActiveIndex(i);
                listRef.current?.scrollToIndex({ index: i, animated: true });
              }}
              style={[styles.thumbWrap, i === activeIndex && styles.thumbWrapActive]}
            >
              <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: 0,
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardLg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  slide: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  placeholderText: { fontSize: 13, color: Colors.textTertiary },
  badge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.chip,
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  counter: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.chip,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dots: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
  thumbs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapActive: {
    borderColor: Colors.primary,
  },
  thumb: { width: '100%', height: '100%' },
});
