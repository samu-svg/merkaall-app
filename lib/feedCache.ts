import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_PREFIX } from '@/constants/brand';
import type { Promocao } from '@/lib/types';

const FEED_CACHE_KEY = `${STORAGE_PREFIX}:feed_cache`;

export type FeedCachePayload = {
  promocoes: Promocao[];
  destaques: Promocao[];
  total: number;
  savedAt: number;
};

export async function loadFeedCache(): Promise<FeedCachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FeedCachePayload;
    if (!Array.isArray(parsed.promocoes) || !Array.isArray(parsed.destaques)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveFeedCache(
  payload: Pick<FeedCachePayload, 'promocoes' | 'destaques' | 'total'>,
): Promise<void> {
  try {
    const data: FeedCachePayload = { ...payload, savedAt: Date.now() };
    await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[feedCache] save:', e);
  }
}
