import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import {
  CategoryPicker,
  isCategorySelectionValid,
} from '@/components/CategoryPicker';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import {
  FEED_CATEGORIAS_MAX,
  FEED_CATEGORIAS_MIN,
} from '@/store/useFeedPrefsStore';

type Props = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  selecionadas: Set<string>;
  onChange: (next: Set<string>) => void;
  onSave: () => void;
  onClose: () => void;
  min?: number;
  max?: number;
};

export function CategoryPickerModal({
  visible,
  title = 'Meus interesses',
  subtitle = 'Escolha as categorias que quer ver no seu feed.',
  selecionadas,
  onChange,
  onSave,
  onClose,
  min = FEED_CATEGORIAS_MIN,
  max = FEED_CATEGORIAS_MAX,
}: Props) {
  const valido = isCategorySelectionValid(selecionadas, min, max);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <X size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <CategoryPicker
          selecionadas={selecionadas}
          onChange={onChange}
          min={min}
          max={max}
        />

        <Pressable
          style={[styles.saveBtn, !valido && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={!valido}
          accessibilityRole="button"
          accessibilityLabel="Salvar interesses"
          accessibilityState={{ disabled: !valido }}
        >
          <Text style={styles.saveBtnText}>Salvar</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
