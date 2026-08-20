import { ActionSheetIOS, Alert, Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { APP_NAME } from '@/constants/brand';
import { getLojaNome } from '@/lib/lojas';
import { buildPromoShareLinks } from '@/lib/promoLink';
import type { Promocao } from '@/lib/types';

function buildWhatsAppMessage(promo: Promocao): string {
  const desconto = Math.round(promo.percentual_desconto);
  const loja = getLojaNome(promo);
  const { universal, app } = buildPromoShareLinks(promo.id);
  return (
    `🔥 *Oferta imperdível na ${loja}!*\n\n` +
    `📦 *${promo.titulo}*\n` +
    `💰 De ~R$${promo.preco_original.toFixed(2)}~ por apenas *R$${promo.preco_desconto.toFixed(2)}*\n` +
    `🏷️ *${desconto}% OFF*\n\n` +
    `🛒 Comprar na loja:\n${promo.link_afiliado}\n\n` +
    `📱 Ver no ${APP_NAME}:\n${universal}\n` +
    `(${app})\n\n` +
    `_Compartilhado pelo ${APP_NAME}_`
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

export function getPromoShareUrl(promo: Promocao): string {
  return buildPromoShareLinks(promo.id).universal;
}

export async function shareNative(promo: Promocao): Promise<void> {
  const desconto = Math.round(promo.percentual_desconto);
  const loja = getLojaNome(promo);
  const { universal } = buildPromoShareLinks(promo.id);
  await Share.share({
    message:
      `${promo.titulo} por R$${promo.preco_desconto.toFixed(2)} (${desconto}% OFF) na ${loja}\n` +
      `Loja: ${promo.link_afiliado}\n` +
      `${APP_NAME}: ${universal}`,
    url: universal,
  });
}

export function openShareSheet(promo: Promocao, onCopied?: () => void): void {
  const options = ['WhatsApp', 'Copiar link', 'Outras opções', 'Cancelar'];
  const shareUrl = getPromoShareUrl(promo);

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: 3, title: promo.titulo },
      (index) => {
        if (index === 0) void shareOnWhatsApp(promo);
        if (index === 1) void copyPromoLink(shareUrl).then(() => onCopied?.());
        if (index === 2) void shareNative(promo);
      },
    );
    return;
  }

  Alert.alert('Compartilhar', promo.titulo, [
    { text: 'WhatsApp', onPress: () => void shareOnWhatsApp(promo) },
    {
      text: 'Copiar link',
      onPress: () => void copyPromoLink(shareUrl).then(() => onCopied?.()),
    },
    { text: 'Outras opções', onPress: () => void shareNative(promo) },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
