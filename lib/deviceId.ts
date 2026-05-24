import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';

const KEY = '@promopro_device_id';

let cached: string | null = null;

function gerarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored) { cached = stored; return stored; }
    const novo = gerarId();
    await AsyncStorage.setItem(KEY, novo);
    cached = novo;
    return novo;
  } catch {
    cached = cached ?? 'fallback-' + Date.now();
    return cached;
  }
}
