import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { AuthModal } from '@/components/AuthModal';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import { useSavedStore } from '@/store/useSavedStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';

type SectionProps = { title: string; children: React.ReactNode };

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

type RowProps = { label: string; value?: string; right?: React.ReactNode; last?: boolean };

function Row({ label, value, right, last }: RowProps) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : right}
    </View>
  );
}

export function ProfileScreen() {
  const [authVisible, setAuthVisible] = useState(false);
  const { session, perfil, isInitialized, isLoading, signOut } = useAuthStore();
  const { saved } = useSavedStore();
  const { alertas } = useAlertsStore();
  const { prefs, setPref, permissionGranted } = useNotificationsStore();
  const alertasAtivos = alertas.filter((a) => a.ativo).length;
  const isLoggedIn = Boolean(session);

  async function handleSignOut() {
    await signOut();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Perfil</Text>

        <Section title="Conta">
          {!isInitialized ? (
            <View style={styles.accountLoading}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : isLoggedIn ? (
            <>
              <Row
                label="Nome"
                value={perfil?.nome ?? session?.user.email?.split('@')[0] ?? 'Usuário'}
              />
              <Row label="E-mail" value={session?.user.email ?? '—'} />
              <Row label="Sincronização" value="Salvos e alertas na nuvem" />
              <View style={[styles.row, styles.rowLast]}>
                <Pressable
                  style={[styles.logoutBtn, isLoading && styles.logoutBtnDisabled]}
                  onPress={() => void handleSignOut()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.danger} size="small" />
                  ) : (
                    <Text style={styles.logoutText}>Sair da conta</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.guestBlock}>
              <Text style={styles.guestText}>
                Você está usando o app como visitante. Crie uma conta para salvar seus dados na
                nuvem.
              </Text>
              <Pressable style={styles.loginBtn} onPress={() => setAuthVisible(true)}>
                <Text style={styles.loginBtnText}>Entrar ou criar conta</Text>
              </Pressable>
            </View>
          )}
        </Section>

        <Section title="Atividade">
          <Row label="Promoções salvas" value={String(saved.length)} />
          <Row label="Alertas ativos" value={String(alertasAtivos)} />
          <Row label="Total de alertas" value={String(alertas.length)} last />
        </Section>

        <Section title="Notificações">
          <Row
            label="Queda de preço (salvos)"
            right={
              <Switch
                value={prefs.quedaPreco}
                onValueChange={(v) => setPref('quedaPreco', v)}
                disabled={!permissionGranted}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={prefs.quedaPreco && permissionGranted ? Colors.primary : Colors.textTertiary}
              />
            }
          />
          <Row
            label="Novas promoções (+50% OFF)"
            right={
              <Switch
                value={prefs.novasPromocoes}
                onValueChange={(v) => setPref('novasPromocoes', v)}
                disabled={!permissionGranted}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={prefs.novasPromocoes && permissionGranted ? Colors.primary : Colors.textTertiary}
              />
            }
            last
          />
        </Section>

        <Section title="Sobre">
          <Row label="Versão" value="1.0.0" />
          <Row label="Banco de dados" value="Supabase" />
          <Row label="Fonte das ofertas" value="Mercado Livre" last />
        </Section>

        <Text style={styles.footer}>
          Preços e disponibilidade podem mudar a qualquer momento.{'\n'}
          Links podem gerar comissão para o app.
        </Text>
      </ScrollView>

      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing.xxxl },
  title: { fontSize: 20, fontWeight: '500', color: Colors.textPrimary, marginBottom: Spacing.xs },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardSm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 14, color: Colors.textPrimary },
  rowValue: { fontSize: 14, color: Colors.textSecondary, maxWidth: '55%', textAlign: 'right' },
  guestBlock: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  guestText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  loginBtnText: {
    color: Colors.surface,
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
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '500',
  },
  footer: { fontSize: 11, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
});
