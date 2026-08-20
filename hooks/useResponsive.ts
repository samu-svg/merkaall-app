import { useWindowDimensions } from 'react-native';

export type ResponsiveInfo = {
  width: number;
  height: number;
  isTablet: boolean;
  isLarge: boolean;
  numColumns: number;
  contentMaxWidth: number;
};

const TABLET_BREAKPOINT = 768;
const LARGE_BREAKPOINT = 1200;

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= TABLET_BREAKPOINT;
  const isLarge = width >= LARGE_BREAKPOINT;

  const numColumns = isLarge ? 4 : isTablet ? 3 : 2;
  const contentMaxWidth = isLarge ? 960 : isTablet ? 720 : width;

  return { width, height, isTablet, isLarge, numColumns, contentMaxWidth };
}
