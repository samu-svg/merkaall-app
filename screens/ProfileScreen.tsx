import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { useSavedStore } from '@/store/useSavedStore';
import { useAlertsStore } from '@/store/useAlertsStore';

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
  const { saved } = useSavedStore();
  const { alertas } = useAlertsStore();
  const alertasAtivos = alertas.filter((a) => a.ativo).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Perfil</Text>

        <Section title="Atividade">
          <Row label="Promoções salvas" value={String(saved.length)} />
          <Row label="Alertas ativos" value={String(alertasAtivos)} />
          <Row label="Total de alertas" value={String(alertas.length)} last />
        </Section>

        <Section title="Notificações">
          <Row
            label="Alertas de preço"
            right={
              <Switch
                value={alertasAtivos > 0}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={alertasAtivos > 0 ? Colors.primary : Colors.textTertiary}
              />
            }
          />
          <Row
            label="Novas promoções"
            right={
              <Switch
                value={false}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={Colors.textTertiary}
              />
            }
            last
          />
        </Section>

        <Section title="Sobre">
          <Row label="Versão" value="1.0.0" />
          <Row label="Banco de dados" value="Supabase Realtime" />
          <Row label="Fonte das ofertas" value="Mercado Livre" last />
        </Section>

        <Text style={styles.footer}>
          Preços e disponibilidade podem mudar a qualquer momento.{'\n'}
          Links podem gerar comissão para o app.
        </Text>
      </ScrollView>
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
  rowValue: { fontSize: 14, color: Colors.textSecondary },
  footer: { fontSize: 11, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
});
