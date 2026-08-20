import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { STORAGE_PREFIX } from '@/constants/brand';
import { migrateStorageKey } from '@/lib/storageMigration';

const LEGACY_PREFIX = '@promocaopro';
const PREFS_KEY = `${STORAGE_PREFIX}:notification_prefs`;
const UNREAD_KEY = `${STORAGE_PREFIX}:unread_notifications`;
const SEEN_IDS_KEY = `${STORAGE_PREFIX}:seen_promo_ids`;

async function migrateLegacyNotificationStorage(): Promise<void> {
  await migrateStorageKey(`${LEGACY_PREFIX}:notification_prefs`, PREFS_KEY);
  await migrateStorageKey(`${LEGACY_PREFIX}:unread_notifications`, UNREAD_KEY);
  await migrateStorageKey(`${LEGACY_PREFIX}:seen_promo_ids`, SEEN_IDS_KEY);
}

export type NotificationPrefs = {
  novasPromocoes: boolean;
  quedaPreco: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  novasPromocoes: true,
  quedaPreco: true,
};

type NotificationsStore = {
  unreadCount: number;
  prefs: NotificationPrefs;
  seenIds: Set<string>;
  isLoaded: boolean;
  permissionGranted: boolean;
  load: () => Promise<void>;
  setPermissionGranted: (granted: boolean) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  setPref: <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => void;
  markSeen: (ids: string[]) => Promise<void>;
  isSeen: (id: string) => boolean;
};

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  unreadCount: 0,
  prefs: DEFAULT_PREFS,
  seenIds: new Set(),
  isLoaded: false,
  permissionGranted: false,

  load: async () => {
    try {
      await migrateLegacyNotificationStorage();
      const [prefsRaw, unreadRaw, seenRaw] = await Promise.all([
        AsyncStorage.getItem(PREFS_KEY),
        AsyncStorage.getItem(UNREAD_KEY),
        AsyncStorage.getItem(SEEN_IDS_KEY),
      ]);
      const prefs: NotificationPrefs = prefsRaw
        ? { ...DEFAULT_PREFS, ...(JSON.parse(prefsRaw) as NotificationPrefs) }
        : DEFAULT_PREFS;
      const unreadCount = unreadRaw ? parseInt(unreadRaw, 10) : 0;
      const seenIds = new Set<string>(seenRaw ? (JSON.parse(seenRaw) as string[]) : []);
      set({ prefs, unreadCount, seenIds, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setPermissionGranted: (granted) => set({ permissionGranted: granted }),

  incrementUnread: () => {
    const next = get().unreadCount + 1;
    set({ unreadCount: next });
    void AsyncStorage.setItem(UNREAD_KEY, String(next));
  },

  clearUnread: () => {
    set({ unreadCount: 0 });
    void AsyncStorage.setItem(UNREAD_KEY, '0');
  },

  setPref: (key, value) => {
    const prefs = { ...get().prefs, [key]: value };
    set({ prefs });
    void AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  markSeen: async (ids) => {
    const seenIds = new Set(get().seenIds);
    for (const id of ids) seenIds.add(id);
    set({ seenIds });
    await AsyncStorage.setItem(SEEN_IDS_KEY, JSON.stringify([...seenIds]));
  },

  isSeen: (id) => get().seenIds.has(id),
}));
