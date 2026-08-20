import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Promocao } from '@/lib/types';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Promoções',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendPromoNotification(promo: Promocao): Promise<void> {
  const desconto = Math.round(promo.percentual_desconto);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Nova promoção!',
      body: `${promo.titulo} com ${desconto}% OFF por R$${promo.preco_desconto.toFixed(2)}`,
      data: { screen: 'feed', promoId: promo.id },
    },
    trigger: null,
  });
}

export async function sendPriceDropNotification(promo: Promocao): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📉 Preço caiu!',
      body: `${promo.titulo} agora por R$${promo.preco_desconto.toFixed(2)}`,
      data: { screen: 'feed', promoId: promo.id },
    },
    trigger: null,
  });
}

export async function sendAlertMatchNotification(
  alertaTitulo: string,
  promo: Promocao,
): Promise<void> {
  const desconto = Math.round(promo.percentual_desconto);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Alerta encontrado!',
      body: `"${alertaTitulo}": ${promo.titulo} por R$${promo.preco_desconto.toFixed(2)} (${desconto}% OFF)`,
      data: { screen: 'feed', promoId: promo.id },
    },
    trigger: null,
  });
}
