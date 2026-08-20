import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ALERTS_STORAGE_KEY,
  SAVED_PRICES_KEY,
  SAVED_STORAGE_KEY,
} from '@/lib/userSync';
import { getSupabaseClient } from '@/lib/supabase';
import { useAlertsStore } from '@/store/useAlertsStore';
import { useSavedStore } from '@/store/useSavedStore';

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

export async function clearLocalUserData(): Promise<void> {
  await AsyncStorage.multiRemove([SAVED_STORAGE_KEY, SAVED_PRICES_KEY, ALERTS_STORAGE_KEY]);
  useSavedStore.getState().setFromSync([]);
  useAlertsStore.getState().setFromSync([]);
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, error: 'Supabase não configurado.' };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { ok: false, error: 'Faça login para excluir a conta.' };
  }

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'delete-account',
    { method: 'POST' },
  );

  if (error) {
    return { ok: false, error: error.message || 'Não foi possível excluir a conta.' };
  }

  if (data?.error) {
    return { ok: false, error: data.error };
  }

  await clearLocalUserData();
  await supabase.auth.signOut({ scope: 'local' });

  return { ok: true };
}
