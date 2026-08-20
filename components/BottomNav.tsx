import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Home, MessageCircle, Heart, Bell, User } from 'lucide-react-native';

import { Colors } from '@/constants/colors';

import { Spacing, Radius } from '@/constants/spacing';



export type TabName = 'home' | 'feed' | 'saved' | 'alerts' | 'profile';



type Props = {

  active: TabName;

  onChange: (tab: TabName) => void;

  badgeCount?: number;

  feedBadgeCount?: number;

};



const TABS = [

  { name: 'home' as TabName, label: 'Início', Icon: Home },

  { name: 'feed' as TabName, label: 'Feed', Icon: MessageCircle },

  { name: 'saved' as TabName, label: 'Salvos', Icon: Heart },

  { name: 'alerts' as TabName, label: 'Alertas', Icon: Bell },

  { name: 'profile' as TabName, label: 'Perfil', Icon: User },

];



export function BottomNav({

  active,

  onChange,

  badgeCount = 0,

  feedBadgeCount = 0,

}: Props) {

  return (

    <View style={styles.container}>

      {TABS.map(({ name, label, Icon }) => {

        const isActive = active === name;

        const color = isActive ? Colors.primary : Colors.textTertiary;

        const showAlertsBadge = name === 'alerts' && badgeCount > 0;

        const showFeedBadge = name === 'feed' && feedBadgeCount > 0;

        const badge = showFeedBadge ? feedBadgeCount : showAlertsBadge ? badgeCount : 0;

        const showBadge = showFeedBadge || showAlertsBadge;

        return (

          <Pressable key={name} style={styles.tab} onPress={() => onChange(name)}>

            <View style={styles.iconWrap}>

              <Icon size={22} color={color} />

              {showBadge && (

                <View style={styles.badge}>

                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>

                </View>

              )}

            </View>

            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>

          </Pressable>

        );

      })}

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flexDirection: 'row',

    backgroundColor: Colors.surface,

    borderRadius: Radius.bottomNav,

    marginHorizontal: Spacing.lg,

    paddingVertical: Spacing.sm + 2,

    borderTopWidth: 1,

    borderTopColor: Colors.border,

  },

  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: Spacing.xs },

  iconWrap: { position: 'relative' },

  badge: {

    position: 'absolute',

    top: -4,

    right: -10,

    minWidth: 16,

    height: 16,

    borderRadius: 8,

    backgroundColor: Colors.primary,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 3,

  },

  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  label: { fontSize: 10, fontWeight: '400', color: Colors.textTertiary },

  labelActive: { color: Colors.primary, fontWeight: '500' },

});

