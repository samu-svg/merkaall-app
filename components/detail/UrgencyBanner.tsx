import { StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';

import { CountdownTimer } from '@/components/CountdownTimer';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

type Props = { expiresAt: string };

export function UrgencyBanner({ expiresAt }: Props) {
  return (
    <View style={styles.banner}>
      <Clock size={14} color={Colors.primary} />
      <Text style={styles.text}>Oferta por tempo limitado · expira em </Text>
      <CountdownTimer expiresAt={expiresAt} style={styles.timer} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.cardSm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: { fontSize: 12, fontWeight: '500', color: Colors.primaryText },
  timer: { fontSize: 12, fontWeight: '600' },
});
