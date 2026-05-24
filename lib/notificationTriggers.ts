import { promoMatchesAlert } from '@/lib/alerts';
import { sendAlertMatchNotification, sendPriceDropNotification, sendPromoNotification } from '@/lib/notifications';
import type { Promocao } from '@/lib/types';
import { useAlertsStore } from '@/store/useAlertsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { useSavedStore } from '@/store/useSavedStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROMO_DISCOUNT_THRESHOLD = 50;
const ALERT_MATCHES_KEY = '@promocaopro:alert_matches';

function canNotify(): boolean {
  const { permissionGranted, isLoaded } = useNotificationsStore.getState();
  return isLoaded && permissionGranted;
}

async function notifyPromo(promo: Promocao) {
  await sendPromoNotification(promo);
  useNotificationsStore.getState().incrementUnread();
}

async function notifyPriceDrop(promo: Promocao) {
  await sendPriceDropNotification(promo);
  useNotificationsStore.getState().incrementUnread();
}

async function wasAlertNotified(alertId: string, promoId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ALERT_MATCHES_KEY);
    const keys: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    return keys.includes(`${alertId}:${promoId}`);
  } catch {
    return false;
  }
}

async function markAlertNotified(alertId: string, promoId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ALERT_MATCHES_KEY);
    const keys: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const key = `${alertId}:${promoId}`;
    if (!keys.includes(key)) {
      keys.push(key);
      await AsyncStorage.setItem(ALERT_MATCHES_KEY, JSON.stringify(keys.slice(-500)));
    }
  } catch {
    // ignore
  }
}

export async function checkAlertsForPromo(promo: Promocao): Promise<void> {
  if (!promo.aprovada || !canNotify()) return;

  const { prefs } = useNotificationsStore.getState();
  if (!prefs.novasPromocoes) return;

  const alertas = useAlertsStore.getState().alertas.filter((a) => a.ativo);
  for (const alerta of alertas) {
    if (!promoMatchesAlert(promo, alerta)) continue;
    if (await wasAlertNotified(alerta.id, promo.id)) continue;
    await sendAlertMatchNotification(alerta.titulo, promo);
    useNotificationsStore.getState().incrementUnread();
    await markAlertNotified(alerta.id, promo.id);
  }
}

export async function handleNewPromo(promo: Promocao): Promise<void> {
  if (!promo.aprovada || !canNotify()) return;

  const { prefs, isSeen, markSeen } = useNotificationsStore.getState();
  if (isSeen(promo.id)) return;

  await markSeen([promo.id]);

  if (prefs.novasPromocoes && promo.percentual_desconto > PROMO_DISCOUNT_THRESHOLD) {
    await notifyPromo(promo);
  }

  if (prefs.novasPromocoes) {
    await checkAlertsForPromo(promo);
  }
}

export async function handlePromoUpdate(
  _anterior: Promocao | undefined,
  atualizada: Promocao,
): Promise<void> {
  if (!atualizada.aprovada || !canNotify()) return;

  const { prefs } = useNotificationsStore.getState();
  const salvo = useSavedStore.getState().saved.find((p) => p.id === atualizada.id);

  if (prefs.quedaPreco && salvo && atualizada.preco_desconto < salvo.preco_desconto) {
    await notifyPriceDrop(atualizada);
  }

  await checkAlertsForPromo(atualizada);
}

export async function seedSeenPromos(promocoes: Promocao[], isInitialLoad: boolean): Promise<void> {
  const ids = promocoes.map((p) => p.id);
  if (ids.length === 0) return;

  const { isSeen, markSeen } = useNotificationsStore.getState();

  if (isInitialLoad) {
    const unseen = ids.filter((id) => !isSeen(id));
    if (unseen.length > 0) await markSeen(unseen);
    return;
  }

  for (const promo of promocoes) {
    if (!isSeen(promo.id) && promo.aprovada) {
      await handleNewPromo(promo);
    }
  }
}
