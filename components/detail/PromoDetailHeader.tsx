import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, Heart } from 'lucide-react-native';

import { ShareButton } from '@/components/ShareButton';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import type { Promocao } from '@/lib/types';

type Props = {
  promo: Promocao;
  salvo: boolean;
  refreshing?: boolean;
  onClose: () => void;
  onSave: () => void;
  onShareCopied?: () => void;
};

export function PromoDetailHeader({
  promo,
  salvo,
  refreshing = false,
  onClose,
  onSave,
  onShareCopied,
}: Props) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onClose}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <ChevronLeft size={22} color={Colors.textPrimary} />
      </Pressable>

      <Text style={styles.title}>Detalhe</Text>

      <View style={styles.actions}>
        {refreshing ? (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
        ) : null}
        <ShareButton promo={promo} variant="pill" onCopied={onShareCopied} />
        <Pressable onPress={onSave} style={[styles.saveBtn, salvo && styles.saveBtnActive]}>
          <Heart size={16} color={Colors.primary} fill={salvo ? Colors.primary : 'none'} />
          <Text style={styles.saveLabel}>{salvo ? 'Salvo' : 'Salvar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  spinner: { marginRight: Spacing.xs },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.button,
  },
  saveBtnActive: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  saveLabel: { fontSize: 12, fontWeight: '500', color: Colors.primary },
});
