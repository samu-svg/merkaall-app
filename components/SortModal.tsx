import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import type { FiltrosAtivos } from '@/lib/types';

type Ordenacao = FiltrosAtivos['ordenacao'];

const OPCOES: { value: Ordenacao; label: string }[] = [
  { value: 'desconto', label: 'Maior desconto' },
  { value: 'preco', label: 'Menor preço' },
  { value: 'avaliacao', label: 'Melhor avaliação' },
  { value: 'recente', label: 'Mais recentes' },
];

type Props = {
  visible: boolean;
  ordenacao: Ordenacao;
  onClose: () => void;
  onSelect: (ordenacao: Ordenacao) => void;
};

export function SortModal({ visible, ordenacao, onClose, onSelect }: Props) {
  function escolher(value: Ordenacao) {
    onSelect(value);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Ordenar por</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
        {OPCOES.map((op, i) => {
          const ativa = op.value === ordenacao;
          return (
            <Pressable
              key={op.value}
              style={[styles.row, i === OPCOES.length - 1 && styles.rowLast]}
              onPress={() => escolher(op.value)}
            >
              <Text style={[styles.rowText, ativa && styles.rowTextAtiva]}>{op.label}</Text>
              {ativa && <Check size={18} color={Colors.primary} />}
            </Pressable>
          );
        })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.cardLg,
    borderTopRightRadius: Radius.cardLg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { fontSize: 15, color: Colors.textPrimary },
  rowTextAtiva: { color: Colors.primary, fontWeight: '500' },
});
