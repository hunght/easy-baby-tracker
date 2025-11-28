/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// BabyEase brand palette (soft, calming, accessible)
export const BrandColors = {
  primary: '#5B7FFF', // calming blue-violet
  secondary: '#FFB347', // warm accent for highlights
  accentPink: '#FF8AB8', // gentle playful pink
  mint: '#7FE3CC', // success / positive
  lavender: '#C7B9FF', // subtle backgrounds
  warning: '#FF7A59', // alerts
  info: '#4BA3C3',
  graySoft: '#F5F7FA',
  grayStrong: '#3F464A',
};
