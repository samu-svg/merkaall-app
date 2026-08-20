import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

type AppFooterProps = {
  message?: string;
  secondaryMessage?: string;
  showLogo?: boolean;
  logoSize?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const DEFAULT_MESSAGE = 'Preços podem mudar. Links podem gerar comissão.';

export function AppFooter({
  message = DEFAULT_MESSAGE,
  secondaryMessage,
  showLogo = true,
  logoSize = 28,
  style,
  children,
}: AppFooterProps) {
  return (
    <View style={[styles.root, style]}>
      {children}
      {showLogo ? <BrandLogo variant="horizontal" size={logoSize} style={styles.logo} /> : null}
      <Text style={styles.message}>{message}</Text>
      {secondaryMessage ? <Text style={styles.secondary}>{secondaryMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  logo: {
    opacity: 0.92,
  },
  message: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
  secondary: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
});
