import { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Plus, Trash2, Bell } from 'lucide-react-native';
import { AppFooter } from '@/components/AppFooter';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { formatAlertCondicao, formatAlertStatus } from '@/lib/alerts';
import { useAlertsStore } from '@/store/useAlertsStore';

function AddAlertForm({ onAdd }: { onAdd: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [precoStr, setPrecoStr] = useState('');
  const [descontoStr, setDescontoStr] = useState('');
  const [ativo, setAtivo] = useState(true);
  const { adicionar } = useAlertsStore();

  function submit() {
    if (!titulo.trim()) return;

    const preco = precoStr.trim()
      ? parseFloat(precoStr.replace(',', '.'))
      : null;
    const desconto = descontoStr.trim()
      ? parseInt(descontoStr, 10)
      : 0;

    if (precoStr.trim() && (isNaN(preco!) || preco! <= 0)) return;
    if (descontoStr.trim() && (isNaN(desconto) || desconto < 0 || desconto > 90)) return;

    adicionar({
      titulo: titulo.trim(),
      precoMaximo: preco,
      descontoMinimo: desconto,
      ativo,
    });
    setTitulo('');
    setPrecoStr('');
    setDescontoStr('');
    setAtivo(true);
    onAdd();
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Novo alerta</Text>
      <TextInput
        style={styles.input}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Nome do produto ou categoria"
        placeholderTextColor={Colors.textTertiary}
      />
      <TextInput
        style={styles.input}
        value={precoStr}
        onChangeText={setPrecoStr}
        placeholder="Preço máximo em R$ (opcional)"
        placeholderTextColor={Colors.textTertiary}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        value={descontoStr}
        onChangeText={setDescontoStr}
        placeholder="Desconto mínimo em % (opcional)"
        placeholderTextColor={Colors.textTertiary}
        keyboardType="number-pad"
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Ativar alerta</Text>
        <Switch
          value={ativo}
          onValueChange={setAtivo}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={ativo ? Colors.primary : Colors.textTertiary}
        />
      </View>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={submit}
      >
        <Plus size={16} color="#fff" />
        <Text style={styles.btnText}>Criar alerta</Text>
      </Pressable>
    </View>
  );
}

export function AlertsScreen() {
  const { alertas, toggleAtivo, remover } = useAlertsStore();
  const [showForm, setShowForm] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertas de Preço</Text>
        <Pressable onPress={() => setShowForm((v) => !v)} style={styles.addBtn}>
          <Plus size={16} color={Colors.primary} />
        </Pressable>
      </View>

      {showForm && <AddAlertForm onAdd={() => setShowForm(false)} />}

      <FlatList
        data={alertas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Nenhum alerta criado</Text>
            <Text style={styles.emptyHint}>Toque em + para criar um alerta de preço.</Text>
          </View>
        }
        ListFooterComponent={alertas.length > 0 ? <AppFooter /> : null}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.ativo && styles.cardInativo]}>
            <View style={styles.cardInfo}>
              <Text style={styles.alertTitulo} numberOfLines={1}>{item.titulo}</Text>
              <Text style={styles.alertCondicao}>{formatAlertCondicao(item)}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, item.ativo ? styles.statusAtivo : styles.statusInativo]}>
                  <Text style={[styles.statusText, item.ativo ? styles.statusTextAtivo : styles.statusTextInativo]}>
                    {formatAlertStatus(item.ativo)}
                  </Text>
                </View>
              </View>
            </View>
            <Switch
              value={item.ativo}
              onValueChange={() => toggleAtivo(item.id)}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={item.ativo ? Colors.primary : Colors.textTertiary}
            />
            <Pressable onPress={() => remover(item.id)} style={styles.removeBtn}>
              <Trash2 size={16} color={Colors.danger} />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: 20, fontWeight: '500', color: Colors.textPrimary },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardLg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  switchLabel: { fontSize: 14, color: Colors.textPrimary },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    height: 44,
  },
  btnPressed: { opacity: 0.85 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.cardSm,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardInativo: { opacity: 0.55 },
  cardInfo: { flex: 1, gap: 4 },
  alertTitulo: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  alertCondicao: { fontSize: 12, color: Colors.textSecondary },
  statusRow: { flexDirection: 'row', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.chip,
  },
  statusAtivo: { backgroundColor: Colors.successLight },
  statusInativo: { backgroundColor: Colors.background },
  statusText: { fontSize: 10, fontWeight: '600' },
  statusTextAtivo: { color: Colors.success },
  statusTextInativo: { color: Colors.textTertiary },
  removeBtn: { padding: Spacing.xs },
  empty: { padding: 48, alignItems: 'center', gap: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  emptyHint: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center' },
});
