import { create } from 'zustand';

import { useNotificationsStore } from '@/store/useNotificationsStore';

type NotificationsUiStore = {
  visible: boolean;
  open: () => void;
  close: () => void;
};

export const useNotificationsUiStore = create<NotificationsUiStore>((set) => ({
  visible: false,
  open: () => {
    useNotificationsStore.getState().clearUnread();
    set({ visible: true });
  },
  close: () => set({ visible: false }),
}));
