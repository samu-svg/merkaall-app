import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Telas com tab bar usam só o topo; modais em ecrã cheio incluem o fundo. */
  edges?: readonly Edge[];
};

export function Screen({ children, style, edges = ['top', 'left', 'right'] }: Props) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
