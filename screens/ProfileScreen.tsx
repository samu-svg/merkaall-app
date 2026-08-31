import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';

import { AppFooter } from '@/components/AppFooter';
import { Screen } from '@/components/Screen';
import { AuthModal } from '@/components/AuthModal';
import { BrandLogo } from '@/components/BrandLogo';
import { CategoryPickerModal } from '@/components/CategoryPickerModal';
import { LegalLinks } from '@/components/LegalLinks';
import { APP_NAME } from '@/constants/brand';
import { Colors, type ColorPalette } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { seedCategoryPreferences } from '@/lib/feedPrefs';
import { requestNotificationPermission } from '@/lib/notifications';
import { registerPushToken } from '@/lib/push';
import { ICONES_CATEGORIA } from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useSavedStore } from '@/store/useSavedStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import {
  FEED_CATEGORIAS_MAX,
  FEED_CATEGORIAS_MIN,
  useFeedPrefsStore,
} from '@/store/useFeedPrefsStore';
type SectionProps = {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
};

function Section({ title, children, styles }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

type RowProps = {
  label: string;
  value?: string;
  right?: React.ReactNode;
  last?: boolean;
  styles: ReturnType<typeof createStyles>;
};

function Row({ label, value, right, last, styles }: RowProps) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : right}
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    scroll: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing.xxxl },
    brandHeader: {
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
    },
    brandTagline: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: 'center',
    },
    title: { fontSize: 20, fontWeight: '500', color: c.textPrimary, marginBottom: Spacing.xs },
    section: { gap: Spacing.sm },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '500',
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    sectionCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.cardSm,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { fontSize: 14, color: c.textPrimary },
    rowValue: { fontSize: 14, color: c.textSecondary, maxWidth: '55%', textAlign: 'right' },
    guestBlock: {
      padding: Spacing.md,
      gap: Spacing.md,
    },
    guestText: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 20,
    },
    loginBtn: {
      backgroundColor: c.primary,
      borderRadius: Radius.button,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    loginBtnText: {
      color: c.surface,
      fontSize: 15,
      fontWeight: '600',
    },
    accountLoading: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    logoutBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    logoutBtnDisabled: {
      opacity: 0.6,
    },
    logoutText: {
      color: c.danger,
      fontSize: 15,
      fontWeight: '500',
    },
    deleteBtn: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    deleteText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.danger,
    },
    legalBlock: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    legalHint: {
      fontSize: 12,
      color: c.textSecondary,
      lineHeight: 18,
    },
    interestsValue: {
      fontSize: 13,
      color: c.textSecondary,
      flex: 1,
      textAlign: 'right',
      marginLeft: Spacing.sm,
    },
    editInterestsBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    editInterestsText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
  });
}
const styles = createStyles(Colors);
const appVersion = Constants.expoConfig?.version ?? '—';

export function ProfileScreen() {
  const [authVisible, setAuthVisible] = useState(false);
  const [interestsVisible, setInterestsVisible] = useState(false);
  const [draftCats, setDraftCats] = useState<Set<string>>(new Set());
  const { session, perfil, isInitialized, isLoading, signOut, deleteAccount } = useAuthStore();
  const { saved } = useSavedStore();
  const { alertas } = useAlertsStore();
  const { prefs, setPref, permissionGranted, setPermissionGranted } = useNotificationsStore();
  const categorias = useFeedPrefsStore((s) => s.categorias);
  const setCategorias = useFeedPrefsStore((s) => s.setCategorias);
  const alertasAtivos = alertas.filter((a) => a.ativo).length;
  const isLoggedIn = Boolean(session);

  const interestsLabel =
    categorias.length === 0
      ? 'Nenhuma selecionada'
      : categorias.map((c) => `${ICONES_CATEGORIA[c] ?? '🏷️'} ${c}`).join(', ');

  function openInterestsEditor() {
    setDraftCats(new Set(categorias));
    setInterestsVisible(true);
  }

  async function saveInterests() {
    const cats = [...draftCats];
    await setCategorias(cats);
    await seedCategoryPreferences(cats);
    setInterestsVisible(false);
  }

  async function handleSignOut() {
    await signOut();
  }

  async function handleNotificationPrefChange(
    key: 'quedaPreco' | 'novasPromocoes',
    value: boolean,
  ) {
    if (value && !permissionGranted) {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (!granted) return;
      void registerPushToken(session?.user?.id ?? null);
    }
    setPref(key, value);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Excluir conta',
      'Esta ação é permanente. Seus dados na nuvem (perfil, salvos, alertas e histórico) serão apagados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const result = await deleteAccount();
              if (!result.ok) {
                Alert.alert('Não foi possível excluir', result.error ?? 'Tente novamente.');
                return;
              }
              Alert.alert(
                'Conta excluída',
                'Seus dados na nuvem foram removidos. Você pode continuar usando o app como visitante.',
              );
            })();
          },
        },
      ],
    );
  }

  async function openNotificationSettings() {
    await Linking.openSettings();
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brandHeader}>
          <BrandLogo variant="horizontal" size={40} />
          <Text style={styles.brandTagline}>Ofertas das melhores lojas</Text>
        </View>

        <Text style={styles.title}>Perfil</Text>

        <Section title="Conta" styles={styles}>
          {!isInitialized ? (
            <View style={styles.accountLoading}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : isLoggedIn ? (
            <>
              <Row
                label="Nome"
                value={perfil?.nome ?? session?.user.email?.split('@')[0] ?? 'Usuário'}
                styles={styles}
              />
              <Row label="E-mail" value={session?.user.email ?? '—'} styles={styles} />
              <View style={styles.row}>
                <Pressable
                  style={[styles.logoutBtn, isLoading && styles.logoutBtnDisabled]}
                  onPress={() => void handleSignOut()}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Sair da conta"
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.danger} size="small" />
                  ) : (
                    <Text style={styles.logoutText}>Sair da conta</Text>
                  )}
                </Pressable>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={handleDeleteAccount}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Excluir conta permanentemente"
                >
                  <Text style={styles.deleteText}>Excluir conta</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.guestBlock}>
              <Text style={styles.guestText}>
                Você está usando o app como visitante. Salvos e alertas funcionam no seu aparelho
                sem conta. Entre ou crie uma conta para sincronizar tudo na nuvem e entre
                dispositivos.
              </Text>
              <Pressable style={styles.loginBtn} onPress={() => setAuthVisible(true)}>
                <Text style={styles.loginBtnText}>Entrar para sincronizar</Text>
              </Pressable>
            </View>
          )}
        </Section>

        <Section title="Atividade" styles={styles}>
          <Row label="Promoções salvas" value={String(saved.length)} styles={styles} />
          <Row label="Alertas ativos" value={String(alertasAtivos)} last styles={styles} />
        </Section>

        <Section title="Meus interesses" styles={styles}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Categorias do feed</Text>
            <Pressable
              style={styles.editInterestsBtn}
              onPress={openInterestsEditor}
              accessibilityRole="button"
              accessibilityLabel="Editar categorias do feed"
            >
              <Text style={styles.editInterestsText}>Editar</Text>
            </Pressable>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.interestsValue} numberOfLines={3}>
              {interestsLabel}
            </Text>
          </View>
        </Section>

        <Section title="Notificações" styles={styles}>
          {!permissionGranted ? (
            <View style={styles.legalBlock}>
              <Text style={styles.legalHint}>
                Ative as notificações do sistema para receber alertas de preço e novas promoções.
              </Text>
              <Pressable
                onPress={() => void requestNotificationPermission().then((granted) => {
                  setPermissionGranted(granted);
                  if (granted) void registerPushToken(session?.user?.id ?? null);
                })}
                accessibilityRole="button"
                accessibilityLabel="Ativar notificações"
              >
                <Text style={styles.editInterestsText}>Ativar notificações</Text>
              </Pressable>
              <Pressable
                onPress={() => void openNotificationSettings()}
                accessibilityRole="button"
                accessibilityLabel="Abrir configurações do sistema"
              >
                <Text style={styles.legalHint}>Ou abrir configurações do aparelho</Text>
              </Pressable>
            </View>
          ) : null}
          <Row
            label="Queda de preço (salvos)"
            styles={styles}
            right={
              <Switch
                value={prefs.quedaPreco}
                onValueChange={(v) => void handleNotificationPrefChange('quedaPreco', v)}
                disabled={!permissionGranted}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={prefs.quedaPreco && permissionGranted ? Colors.primary : Colors.textTertiary}
              />
            }
          />
          <Row
            label="Novas promoções (+50% OFF)"
            styles={styles}
            last
            right={
              <Switch
                value={prefs.novasPromocoes}
                onValueChange={(v) => void handleNotificationPrefChange('novasPromocoes', v)}
                disabled={!permissionGranted}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={prefs.novasPromocoes && permissionGranted ? Colors.primary : Colors.textTertiary}
              />
            }
          />
        </Section>

        <Section title="Legal" styles={styles}>
          <View style={[styles.legalBlock, styles.rowLast, { borderBottomWidth: 0 }]}>
            <Text style={styles.legalHint}>
              Saiba como tratamos seus dados e as regras de uso do app.
            </Text>
            <LegalLinks variant="stack" showContact showAccountDeletion />
          </View>
        </Section>

        <Section title="Sobre" styles={styles}>
          <Row label="App" value={APP_NAME} styles={styles} />
          <Row label="Versão" value={appVersion} last styles={styles} />
        </Section>

        <AppFooter
          message="Preços e disponibilidade podem mudar a qualquer momento."
          secondaryMessage="Links podem gerar comissão para o app."
        />
      </ScrollView>

      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />

      <CategoryPickerModal
        visible={interestsVisible}
        selecionadas={draftCats}
        onChange={setDraftCats}
        onSave={() => void saveInterests()}
        onClose={() => setInterestsVisible(false)}
        min={FEED_CATEGORIAS_MIN}
        max={FEED_CATEGORIAS_MAX}
        subtitle={`Escolha de ${FEED_CATEGORIAS_MIN} a ${FEED_CATEGORIAS_MAX} categorias para o seu feed.`}
      />
    </Screen>
  );
}
