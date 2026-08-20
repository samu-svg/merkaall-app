import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDeviceId } from '@/lib/deviceId';
import { requestNotificationPermission } from '@/lib/notifications';
import { getSupabaseClient } from '@/lib/supabase';

function getEasProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? null;
}

export async function registerPushToken(userId?: string | null): Promise<void> {
  if (Platform.OS === 'web') return;

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('[push] Supabase indisponível; token não registrado.');
    return;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn('[push] eas.projectId ausente em app.json; token não obtido.');
    return;
  }

  try {
    const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoToken = tokenData;
    if (!expoToken) return;

    const deviceId = await getDeviceId();
    const { error } = await supabase.from('device_push_tokens').upsert(
      {
        device_id: deviceId,
        user_id: userId ?? null,
        expo_token: expoToken,
        platform: Platform.OS,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'device_id' },
    );

    if (error) console.warn('[push] upsert token:', error.message);
  } catch (err) {
    console.warn('[push] registerPushToken:', err);
  }
}
