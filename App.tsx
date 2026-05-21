import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomNav, type TabName } from '@/components/BottomNav';
import { Colors } from '@/constants/colors';
import { useSavedStore } from '@/store/useSavedStore';
import { useAlertsStore } from '@/store/useAlertsStore';
import { HomeScreen } from '@/screens/HomeScreen';
import { SavedScreen } from '@/screens/SavedScreen';
import { AlertsScreen } from '@/screens/AlertsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { useState } from 'react';

function AppContent() {
  const [tab, setTab] = useState<TabName>('home');
  const loadSaved = useSavedStore((s) => s.load);
  const loadAlerts = useAlertsStore((s) => s.load);

  useEffect(() => {
    void loadSaved();
    void loadAlerts();
  }, [loadSaved, loadAlerts]);

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'saved' && <SavedScreen />}
        {tab === 'alerts' && <AlertsScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </View>
      <View style={styles.navWrap}>
        <BottomNav active={tab} onChange={setTab} />
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
