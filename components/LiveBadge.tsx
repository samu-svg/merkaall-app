import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

type Props = { aoVivo: boolean };

export function LiveBadge({ aoVivo }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!aoVivo) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [aoVivo, pulse]);

  return (
    <View style={styles.badge}>
      <Animated.View style={[styles.dot, aoVivo && styles.dotOn, { transform: [{ scale: pulse }] }]} />
      <Text style={[styles.label, aoVivo && styles.labelOn]}>
        {aoVivo ? 'ao vivo' : 'conectando...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.chip,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textTertiary },
  dotOn: { backgroundColor: Colors.primary },
  label: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary },
  labelOn: { color: Colors.primaryText },
});
