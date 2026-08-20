import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { LEGAL_URLS } from '@/constants/brand';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

type Props = {
  variant?: 'inline' | 'stack';
  showContact?: boolean;
  showAccountDeletion?: boolean;
};

async function openLegalUrl(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

export function LegalLinks({
  variant = 'inline',
  showContact = false,
  showAccountDeletion = false,
}: Props) {
  const isStack = variant === 'stack';

  return (
    <View style={[styles.root, isStack && styles.rootStack]}>
      <Pressable
        onPress={() => void openLegalUrl(LEGAL_URLS.privacy)}
        accessibilityRole="link"
        accessibilityLabel="Política de Privacidade"
      >
        <Text style={styles.link}>Política de Privacidade</Text>
      </Pressable>

      {!isStack && <Text style={styles.sep}> · </Text>}

      <Pressable
        onPress={() => void openLegalUrl(LEGAL_URLS.terms)}
        accessibilityRole="link"
        accessibilityLabel="Termos de Uso"
      >
        <Text style={styles.link}>Termos de Uso</Text>
      </Pressable>

      {showContact ? (
        <>
          {!isStack && <Text style={styles.sep}> · </Text>}
          <Pressable
            onPress={() => void openLegalUrl(LEGAL_URLS.contact)}
            accessibilityRole="link"
            accessibilityLabel="Contato"
          >
            <Text style={styles.link}>Contato</Text>
          </Pressable>
        </>
      ) : null}

      {showAccountDeletion ? (
        <>
          {!isStack && <Text style={styles.sep}> · </Text>}
          <Pressable
            onPress={() => void openLegalUrl(LEGAL_URLS.accountDeletion)}
            accessibilityRole="link"
            accessibilityLabel="Exclusão de conta na web"
          >
            <Text style={styles.link}>Excluir conta (web)</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rootStack: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  link: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  sep: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
