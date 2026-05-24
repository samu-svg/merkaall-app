import { ActionSheetIOS, Alert, Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import type { Promocao } from '@/lib/types';

function buildWhatsAppMessage(promo: Promocao): string {
  const desconto = Math.round(promo.percentual_desconto);
  return (
    `🔥 *Oferta imperdível no Mercado Livre!*\n\n` +
    `📦 *${promo.titulo}*\n` +
    `💰 De ~R$${promo.preco_original.toFixed(2)}~ por apenas *R$${promo.preco_desconto.toFixed(2)}*\n` +
    `🏷️ *${desconto}% OFF*\n\n` +
    `👉 ${promo.link_afiliado}\n\n` +
    `_Compartilhado pelo PromoçãoPro_`
  );
}

export async function shareOnWhatsApp(promo: Promocao): Promise<void> {
  const msg = buildWhatsAppMessage(promo);
  const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }
  await Share.share({ message: msg });
}

export async function copyPromoLink(url: string): Promise<void> {
  await Clipboard.setStringAsync(url);
}

export async function shareNative(promo: Promocao): Promise<void> {
  const desconto = Math.round(promo.percentual_desconto);
  await Share.share({
    message: `${promo.titulo} por R$${promo.preco_desconto.toFixed(2)} (${desconto}% OFF) no Mercado Livre: ${promo.link_afiliado}`,
    url: promo.link_afiliado,
  });
}

export function openShareSheet(promo: Promocao, onCopied?: () => void): void {
  const options = ['WhatsApp', 'Copiar link', 'Outras opções', 'Cancelar'];

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: 3, title: promo.titulo },
      (index) => {
        if (index === 0) void shareOnWhatsApp(promo);
        if (index === 1) void copyPromoLink(promo.link_afiliado).then(() => onCopied?.());
        if (index === 2) void shareNative(promo);
      },
    );
    return;
  }

  Alert.alert('Compartilhar', promo.titulo, [
    { text: 'WhatsApp', onPress: () => void shareOnWhatsApp(promo) },
    {
      text: 'Copiar link',
      onPress: () => void copyPromoLink(promo.link_afiliado).then(() => onCopied?.()),
    },
    { text: 'Outras opções', onPress: () => void shareNative(promo) },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
