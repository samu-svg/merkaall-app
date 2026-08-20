import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type BrandLogoProps = {
  variant?: 'icon' | 'horizontal';
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

const ICON_SOURCE = require('@/assets/icon.png');
const LOGO_SOURCE = require('@/assets/merkaall-logo.png');

export function BrandLogo({
  variant = 'icon',
  size = 32,
  style,
  imageStyle,
}: BrandLogoProps) {
  if (variant === 'horizontal') {
    const height = size;
    const width = Math.round(height * 3.15);
    return (
      <View style={[styles.horizontalWrap, style]}>
        <Image
          source={LOGO_SOURCE}
          style={[{ width, height, backgroundColor: 'transparent' }, imageStyle]}
          contentFit="contain"
          accessibilityLabel="Merkaall"
        />
      </View>
    );
  }

  const radius = Math.round(size * 0.22);
  return (
    <View style={[styles.iconWrap, { width: size, height: size, borderRadius: radius }, style]}>
      <Image
        source={ICON_SOURCE}
        style={[{ width: size, height: size, borderRadius: radius }, imageStyle]}
        contentFit="cover"
        accessibilityLabel="Merkaall"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    overflow: 'hidden',
  },
  horizontalWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
