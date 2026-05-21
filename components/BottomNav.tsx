import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Home, Heart, Bell, User } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Spacing, Radius } from '@/constants/spacing';

export type TabName = 'home' | 'saved' | 'alerts' | 'profile';

type Props = {
  active: TabName;
  onChange: (tab: TabName) => void;
};

const TABS = [
  { name: 'home' as TabName, label: 'Início', Icon: Home },
  { name: 'saved' as TabName, label: 'Salvos', Icon: Heart },
  { name: 'alerts' as TabName, label: 'Alertas', Icon: Bell },
  { name: 'profile' as TabName, label: 'Perfil', Icon: User },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map(({ name, label, Icon }) => {
        const isActive = active === name;
        const color = isActive ? Colors.primary : Colors.textTertiary;
        return (
          <Pressable key={name} style={styles.tab} onPress={() => onChange(name)}>
            <Icon size={22} color={color} />
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
  label: { fontSize: 10, fontWeight: '400', color: Colors.textTertiary },
  labelActive: { color: Colors.primary, fontWeight: '500' },
});
