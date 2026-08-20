import { StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';

export function AppSplash() {
  return (
    <View style={styles.root}>
      <BrandLogo variant="horizontal" size={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
