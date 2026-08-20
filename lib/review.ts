import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_PREFIX } from '@/constants/brand';

const REVIEW_REQUESTED_KEY = `${STORAGE_PREFIX}:review_requested`;
const REVIEW_COUNTERS_KEY = `${STORAGE_PREFIX}:review_counters`;

type ReviewAction = 'favorite' | 'open_link';

const THRESHOLDS: Record<ReviewAction, number> = {
  favorite: 3,
  open_link: 5,
};

type ReviewCounters = Partial<Record<ReviewAction, number>>;

async function loadCounters(): Promise<ReviewCounters> {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_COUNTERS_KEY);
    return raw ? (JSON.parse(raw) as ReviewCounters) : {};
  } catch {
    return {};
  }
}

async function saveCounters(counters: ReviewCounters): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_COUNTERS_KEY, JSON.stringify(counters));
  } catch {
    /* indisponível */
  }
}

async function wasReviewRequested(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(REVIEW_REQUESTED_KEY)) === 'true';
  } catch {
    return true;
  }
}

async function markReviewRequested(): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, 'true');
  } catch {
    /* indisponível */
  }
}

export async function maybeRequestReview(action: ReviewAction): Promise<void> {
  try {
    if (await wasReviewRequested()) return;

    const counters = await loadCounters();
    const next = (counters[action] ?? 0) + 1;
    counters[action] = next;
    await saveCounters(counters);

    const reached =
      (counters.favorite ?? 0) >= THRESHOLDS.favorite ||
      (counters.open_link ?? 0) >= THRESHOLDS.open_link;
    if (!reached) return;

    const StoreReview = require('expo-store-review') as {
      isAvailableAsync: () => Promise<boolean>;
      requestReview: () => Promise<void>;
    };

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await markReviewRequested();
    await StoreReview.requestReview();
  } catch {
    /* loja indisponível ou lib não instalada */
  }
}
