import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSplash } from '@/components/AppSplash';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BottomNav, type TabName } from '@/components/BottomNav';
import { BrandLogo } from '@/components/BrandLogo';
import { Onboarding } from '@/components/Onboarding';
import { Colors } from '@/constants/colors';
import { STORAGE_PREFIX } from '@/constants/brand';
import { Spacing } from '@/constants/spacing';
import { parsePromoId } from '@/lib/deepLink';
import { initMonitoring } from '@/lib/monitoring';
import { configureNotificationHandler } from '@/lib/notifications';
import { registerPushToken } from '@/lib/push';
import { buscarPromocaoPorId } from '@/lib/supabase';
import { useSavedStore } from '@/store/useSavedStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePromoDetailStore } from '@/store/usePromoDetailStore';
import { useFeedPrefsStore } from '@/store/useFeedPrefsStore';
import { useNotificationsUiStore } from '@/store/useNotificationsUiStore';
import { HomeScreen } from '@/screens/HomeScreen';
import { FeedScreen } from '@/screens/FeedScreen';
import { SavedScreen } from '@/screens/SavedScreen';
import { AlertsScreen } from '@/screens/AlertsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { PromoDetailScreen } from '@/screens/PromoDetailScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';

configureNotificationHandler();
initMonitoring();

SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash já oculto em reloads quentes */
});

const SPLASH_MIN_MS = 900;
const BOOT_TIMEOUT_MS = 8000;
const ONBOARDING_KEY = `${STORAGE_PREFIX}:onboarding_done`;

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
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 0,
    gap: 4,
  },
  navBrand: {
    alignSelf: 'center',
    opacity: 0.88,
  },
});

function AppContent({
  onBootComplete,
  showOnboarding,
  onOnboardingComplete,
}: {
  onBootComplete: () => void;
  showOnboarding: boolean | null;
  onOnboardingComplete: () => void;
}) {
  const [tab, setTab] = useState<TabName>('home');
  const loadSaved = useSavedStore((s) => s.load);
  const loadAlerts = useAlertsStore((s) => s.load);
  const loadNotifications = useNotificationsStore((s) => s.load);
  const initAuth = useAuthStore((s) => s.init);
  const session = useAuthStore((s) => s.session);
  const setPermissionGranted = useNotificationsStore((s) => s.setPermissionGranted);
  const permissionGranted = useNotificationsStore((s) => s.permissionGranted);
  const clearUnread = useNotificationsStore((s) => s.clearUnread);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const detailPromo = usePromoDetailStore((s) => s.promo);
  const openDetail = usePromoDetailStore((s) => s.open);
  const closeDetail = usePromoDetailStore((s) => s.close);
  const notificationsVisible = useNotificationsUiStore((s) => s.visible);
  const closeNotifications = useNotificationsUiStore((s) => s.close);
  const loadFeedPrefs = useFeedPrefsStore((s) => s.load);
  const feedUnreadCount = useFeedPrefsStore((s) => s.feedUnreadCount);

  const handleOnboardingDone = useCallback(() => {
    onOnboardingComplete();
  }, [onOnboardingComplete]);

  const handleDeepLink = useCallback(
    async (url: string | null) => {
      const promoId = parsePromoId(url);
      if (!promoId) return;

      const { data, error } = await buscarPromocaoPorId(promoId);
      if (data) {
        openDetail(data);
        setTab('home');
        return;
      }

      Alert.alert(
        'Oferta não encontrada',
        error ?? 'Não foi possível abrir esta promoção.',
      );
    },
    [openDetail],
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const minDelay = new Promise<void>((resolve) => {
        setTimeout(resolve, SPLASH_MIN_MS);
      });
      const loads = Promise.all([
        loadSaved(),
        loadAlerts(),
        loadNotifications(),
        loadFeedPrefs(),
      ]);
      const timeout = new Promise<void>((resolve) => {
        setTimeout(resolve, BOOT_TIMEOUT_MS);
      });
      await Promise.race([Promise.all([loads, minDelay]), timeout]);
      if (!cancelled) onBootComplete();
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadSaved, loadAlerts, loadNotifications, loadFeedPrefs, onBootComplete]);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  useEffect(() => {
    if (showOnboarding !== false) return;
    void Notifications.getPermissionsAsync().then(({ status }) => {
      setPermissionGranted(status === 'granted');
    });
  }, [showOnboarding, setPermissionGranted]);

  useEffect(() => {
    if (!permissionGranted) return;
    void registerPushToken(session?.user?.id ?? null);
  }, [permissionGranted, session?.user?.id]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      clearUnread();
      const data = response.notification.request.content.data;
      const promoId = data?.promoId as string | undefined;
      const screen = data?.screen as string | undefined;

      if (promoId) {
        void (async () => {
          const { data: promo } = await buscarPromocaoPorId(promoId);
          if (promo) {
            openDetail(promo);
          }
          setTab('feed');
        })();
        return;
      }

      setTab(screen === 'feed' ? 'feed' : 'alerts');
    });
    return () => sub.remove();
  }, [clearUnread, openDetail]);

  useEffect(() => {
    if (tab === 'feed') {
      void useFeedPrefsStore.getState().markVisited();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'alerts') clearUnread();
  }, [tab, clearUnread]);

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      if (url) void handleDeepLink(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleDeepLink(url);
    });
    return () => sub.remove();
  }, [handleDeepLink]);

  function handleTabChange(next: TabName) {
    setTab(next);
    if (next === 'alerts') clearUnread();
  }

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'feed' && <FeedScreen />}
        {tab === 'saved' && <SavedScreen />}
        {tab === 'alerts' && <AlertsScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </View>

      <Modal
        visible={!!detailPromo}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeDetail}
      >
        <PromoDetailScreen onClose={closeDetail} />
      </Modal>

      <Modal
        visible={notificationsVisible && !detailPromo}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeNotifications}
      >
        <NotificationsScreen onClose={closeNotifications} />
      </Modal>

      <Onboarding
        visible={showOnboarding === true && !detailPromo && !notificationsVisible}
        onComplete={handleOnboardingDone}
      />

      {!detailPromo && !notificationsVisible && showOnboarding === false && (
        <View style={styles.navWrap}>
          <BrandLogo variant="horizontal" size={22} style={styles.navBrand} />
          <BottomNav
            active={tab}
            onChange={handleTabChange}
            badgeCount={unreadCount}
            feedBadgeCount={feedUnreadCount}
          />
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!booted) return;
    void AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setShowOnboarding(value !== 'true');
    });
  }, [booted]);

  const handleOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {!booted && <AppSplash />}
        <AppContent
          onBootComplete={handleBootComplete}
          showOnboarding={showOnboarding}
          onOnboardingComplete={() => void handleOnboardingComplete()}
        />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}