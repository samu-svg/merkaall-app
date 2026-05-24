import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomNav, type TabName } from '@/components/BottomNav';
import { Colors } from '@/constants/colors';
import { configureNotificationHandler, requestNotificationPermission } from '@/lib/notifications';
import { useSavedStore } from '@/store/useSavedStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { HomeScreen } from '@/screens/HomeScreen';
import { SavedScreen } from '@/screens/SavedScreen';
import { AlertsScreen } from '@/screens/AlertsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';

configureNotificationHandler();

function AppContent() {
  const [tab, setTab] = useState<TabName>('home');
  const loadSaved = useSavedStore((s) => s.load);
  const loadAlerts = useAlertsStore((s) => s.load);
  const loadNotifications = useNotificationsStore((s) => s.load);
  const initAuth = useAuthStore((s) => s.init);
  const setPermissionGranted = useNotificationsStore((s) => s.setPermissionGranted);
  const clearUnread = useNotificationsStore((s) => s.clearUnread);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const permissionAsked = useRef(false);

  useEffect(() => {
    void loadSaved();
    void loadAlerts();
    void loadNotifications();
  }, [loadSaved, loadAlerts, loadNotifications]);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  useEffect(() => {
    if (permissionAsked.current) return;
    permissionAsked.current = true;
    void requestNotificationPermission().then(setPermissionGranted);
  }, [setPermissionGranted]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      setTab('alerts');
      clearUnread();
    });
    return () => sub.remove();
  }, [clearUnread]);

  useEffect(() => {
    if (tab === 'alerts') clearUnread();
  }, [tab, clearUnread]);

  function handleTabChange(next: TabName) {
    setTab(next);
    if (next === 'alerts') clearUnread();
  }

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'saved' && <SavedScreen />}
        {tab === 'alerts' && <AlertsScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </View>
      <View style={styles.navWrap}>
        <BottomNav active={tab} onChange={handleTabChange} badgeCount={unreadCount} />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screen: {
    flex: 1,
  },
  navWrap: {
    backgroundColor: Colors.background,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 0,
  },
});
