import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Share2 } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { openShareSheet } from '@/lib/share';
import type { Promocao } from '@/lib/types';

type Props = {
  promo: Promocao;
  size?: number;
  style?: ViewStyle;
  variant?: 'icon' | 'pill';
};

export function ShareButton({ promo, size = 14, style, variant = 'icon' }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openShareSheet(promo, () => setCopied(true));
  }

  if (variant === 'pill') {
    return (
      <Pressable onPress={handlePress} style={[styles.pill, style]}>
        {copied ? (
          <Text style={styles.copiedText}>Copiado!</Text>
        ) : (
          <>
            <Share2 size={size} color={Colors.primary} />
            <Text style={styles.pillText}>Compartilhar</Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={[styles.iconBtn, style]}>
      {copied ? (
        <Text style={styles.copiedSmall}>✓</Text>
      ) : (
        <Share2 size={size} color={Colors.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    backgroundColor: Colors.primaryLight,
    padding: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    minHeight: 24,
  },
  copiedSmall: { fontSize: 12, color: Colors.success, fontWeight: '700' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  pillText: { fontSize: 12, fontWeight: '500', color: Colors.primary },
  copiedText: { fontSize: 12, fontWeight: '500', color: Colors.success },
});
