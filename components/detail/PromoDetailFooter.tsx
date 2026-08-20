import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, ExternalLink, Heart, ShoppingBag } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';
import { getLojaTema } from '@/lib/lojas';

type Props = {
  lojaNome: string;
  salvo: boolean;
  onSave: () => void;
  onOpenOffer: () => void;
  onCopyLink: () => void;
  onMonitorPrice?: () => void;
  monitorando?: boolean;
};

export function PromoDetailFooter({
  lojaNome,
  salvo,
  onSave,
  onOpenOffer,
  onCopyLink,
  onMonitorPrice,
  monitorando = false,
}: Props) {
  const tema = getLojaTema(lojaNome);

  return (
    <View style={styles.footer}>
      <Pressable
        onPress={onOpenOffer}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: tema.background,
            borderColor: tema.borda,
          },
          pressed && styles.ctaPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Ir para ${lojaNome}`}
      >
        <ShoppingBag size={20} color={tema.texto} />
        <Text style={[styles.ctaText, { color: tema.texto }]} numberOfLines={1}>
          Ir para {lojaNome}
        </Text>
        <ExternalLink size={18} color={tema.texto} />
      </Pressable>

      <View style={styles.row}>
        <Pressable
          onPress={onSave}
          style={[styles.secondaryBtn, salvo && styles.saveBtnActive]}
          accessibilityRole="button"
          accessibilityLabel={salvo ? 'Remover dos salvos' : 'Salvar promoção'}
        >
          <Heart size={16} color={Colors.primary} fill={salvo ? Colors.primary : 'none'} />
          <Text style={styles.secondaryText}>{salvo ? 'Salvo' : 'Salvar'}</Text>
        </Pressable>

        {onMonitorPrice ? (
          <Pressable
            onPress={onMonitorPrice}
            style={[styles.secondaryBtn, monitorando && styles.monitorBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={
              monitorando ? 'Preço já monitorado' : 'Monitorar preço desta promoção'
            }
          >
            <Bell size={16} color={monitorando ? Colors.success : Colors.primary} />
            <Text
              style={[
                styles.secondaryText,
                monitorando && styles.monitorTextActive,
              ]}
            >
              {monitorando ? 'Monitorando' : 'Monitorar'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable onPress={onCopyLink} style={styles.copyLink}>
        <Text style={styles.copyLinkText}>Copiar link da oferta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.button,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  ctaText: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  saveBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  monitorBtnActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  secondaryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  monitorTextActive: { color: Colors.success },
  copyLink: { alignItems: 'center', paddingVertical: Spacing.xs },
  copyLinkText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
});
