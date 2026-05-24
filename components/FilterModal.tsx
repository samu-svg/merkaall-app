import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { X } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { fmtBRL } from '@/lib/format';
import {
  DESCONTO_MAX_PADRAO,
  PRECO_MAX_PADRAO,
  PRECO_MIN_PADRAO,
  resetFiltrosModal,
} from '@/lib/filters';
import { ICONES_CATEGORIA, TODAS_AS_CATEGORIAS, type FiltrosAtivos } from '@/lib/types';

type Props = {
  visible: boolean;
  filtros: FiltrosAtivos;
  onClose: () => void;
  onApply: (patch: Pick<FiltrosAtivos, 'precoMin' | 'precoMax' | 'descontoMinimo' | 'categorias'>) => void;
};

export function FilterModal({ visible, filtros, onClose, onApply }: Props) {
  const [precoMin, setPrecoMin] = useState(filtros.precoMin);
  const [precoMax, setPrecoMax] = useState(filtros.precoMax);
  const [descontoMinimo, setDescontoMinimo] = useState(filtros.descontoMinimo);
  const [categorias, setCategorias] = useState<string[]>(filtros.categorias);

  useEffect(() => {
    if (!visible) return;
    setPrecoMin(filtros.precoMin);
    setPrecoMax(filtros.precoMax);
    setDescontoMinimo(filtros.descontoMinimo);
    setCategorias(filtros.categorias);
  }, [visible, filtros]);

  function toggleCategoria(cat: string) {
    setCategorias((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function handlePrecoMin(v: number) {
    const val = Math.round(v);
    setPrecoMin(val);
    if (val > precoMax) setPrecoMax(val);
  }

  function handlePrecoMax(v: number) {
    const val = Math.round(v);
    setPrecoMax(val);
    if (val < precoMin) setPrecoMin(val);
  }

  function limpar() {
    const reset = resetFiltrosModal();
    setPrecoMin(reset.precoMin);
    setPrecoMax(reset.precoMax);
    setDescontoMinimo(reset.descontoMinimo);
    setCategorias(reset.categorias);
    onApply(reset);
    onClose();
  }

  function aplicar() {
    onApply({ precoMin, precoMax, descontoMinimo, categorias });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Filtrar promoções</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Faixa de preço</Text>
          <Text style={styles.rangeValue}>
            {fmtBRL.format(precoMin)} — {fmtBRL.format(precoMax)}
          </Text>
          <Text style={styles.sublabel}>Mínimo</Text>
          <Slider
            style={styles.slider}
            minimumValue={PRECO_MIN_PADRAO}
            maximumValue={PRECO_MAX_PADRAO}
            step={10}
            value={precoMin}
            onValueChange={handlePrecoMin}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />
          <Text style={styles.sublabel}>Máximo</Text>
          <Slider
            style={styles.slider}
            minimumValue={PRECO_MIN_PADRAO}
            maximumValue={PRECO_MAX_PADRAO}
            step={10}
            value={precoMax}
            onValueChange={handlePrecoMax}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />

          <Text style={styles.label}>Desconto mínimo</Text>
          <Text style={styles.rangeValue}>{Math.round(descontoMinimo)}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={DESCONTO_MAX_PADRAO}
            step={5}
            value={descontoMinimo}
            onValueChange={(v) => setDescontoMinimo(Math.round(v))}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />

          <Text style={styles.label}>Categorias</Text>
          <View style={styles.chips}>
            {TODAS_AS_CATEGORIAS.map((cat) => {
              const ativa = categorias.includes(cat);
              return (
                <Pressable
                  key={cat}
                  onPress={() => toggleCategoria(cat)}
                  style={[styles.chip, ativa && styles.chipAtiva]}
                >
                  <Text style={styles.chipIcon}>{ICONES_CATEGORIA[cat]}</Text>
                  <Text style={[styles.chipText, ativa && styles.chipTextAtiva]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.btnSec} onPress={limpar}>
            <Text style={styles.btnSecText}>Limpar filtros</Text>
          </Pressable>
          <Pressable style={styles.btnPri} onPress={aplicar}>
            <Text style={styles.btnPriText}>Aplicar filtros</Text>
          </Pressable>
        </View>
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
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
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
  body: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xl },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  sublabel: { fontSize: 11, color: Colors.textTertiary, marginTop: Spacing.xs },
  rangeValue: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  slider: { width: '100%', height: 36 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipAtiva: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipIcon: { fontSize: 12 },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  chipTextAtiva: { color: '#fff' },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnSec: {
    flex: 1,
    height: 44,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  btnPri: {
    flex: 1,
    height: 44,
    borderRadius: Radius.button,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPriText: { fontSize: 14, fontWeight: '500', color: '#fff' },
});
