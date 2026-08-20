import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/spacing';

type Props = {
  label: string;
  ativa: boolean;
  onPress: () => void;
};

export function CategoryTab({ label, ativa, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Text style={[styles.label, ativa && styles.labelAtiva]}>{label}</Text>
      {ativa ? <View style={styles.underline} /> : <View style={styles.underlinePlaceholder} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1a1a1a',
  },
  labelAtiva: {
    fontWeight: '700',
  },
  underline: {
    marginTop: 4,
    width: '100%',
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
  },
  underlinePlaceholder: {
    marginTop: 4,
    height: 3,
  },
});
