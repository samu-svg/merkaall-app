import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

type Props = {
  message: string | null;
  onHide: () => void;
  durationMs?: number;
};

export function Toast({ message, onHide, durationMs = 2000 }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onHide, durationMs);
    return () => clearTimeout(t);
  }, [message, onHide, durationMs]);

  if (!message) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + Spacing.sm }]} pointerEvents="none">
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 200,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    maxWidth: '100%',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
