import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    /* BabyEase brand colors - Light mode */
    background: 'hsl(240 20% 98%)' /* #F5F7FA */,
    foreground: 'hsl(210 11% 7%)' /* #11181C */,
    card: 'hsl(0 0% 100%)' /* white */,
    cardForeground: 'hsl(210 11% 7%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(210 11% 7%)',
    primary: '#5B7FFF' /* BabyEase brand primary */,
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: '#FFB347' /* BabyEase warm accent */,
    secondaryForeground: 'hsl(210 11% 7%)',
    muted: 'hsl(250 60% 88%)' /* #C7B9FF - Lavender */,
    mutedForeground: 'hsl(210 7% 26%)',
    accent: '#FF8AB8' /* BabyEase playful pink */,
    accentForeground: 'hsl(0 0% 100%)',
    destructive: '#FF7A59' /* BabyEase warning */,
    destructiveForeground: 'hsl(0 0% 100%)',
    border: 'hsl(240 10% 90%)',
    input: 'hsl(240 10% 90%)',
    ring: '#5B7FFF' /* Primary */,
    radius: '0.75rem' /* 12px for cards */,
    /* BabyEase brand-specific colors */
    mint: '#7FE3CC',
    info: '#4BA3C3',
    lavender: '#C7B9FF',
    warning: '#FF7A59' /* Alias for destructive */,
    /* Chart colors - BabyEase brand palette */
    chart1: '#5B7FFF' /* Primary */,
    chart2: '#FFB347' /* Secondary */,
    chart3: '#FF8AB8' /* Accent Pink */,
    chart4: '#7FE3CC' /* Mint */,
    chart5: '#FF7A59' /* Warning */,
  },
  dark: {
    /* BabyEase brand colors - Dark mode */
    background: 'hsl(210 11% 7%)' /* #11181C */,
    foreground: 'hsl(210 17% 93%)' /* #ECEDEE */,
    card: 'hsl(210 10% 10%)',
    cardForeground: 'hsl(210 17% 93%)',
    popover: 'hsl(210 10% 10%)',
    popoverForeground: 'hsl(210 17% 93%)',
    primary: '#6B9FFF' /* BabyEase primary (lighter for dark) */,
    primaryForeground: 'hsl(210 11% 7%)',
    secondary: '#FFB86D' /* BabyEase secondary (lighter for dark) */,
    secondaryForeground: 'hsl(210 11% 7%)',
    muted: 'hsl(210 10% 15%)',
    mutedForeground: 'hsl(210 10% 65%)',
    accent: '#FF8AB8' /* BabyEase accent */,
    accentForeground: 'hsl(0 0% 100%)',
    destructive: '#FF9B7A' /* Warning (lighter for dark) */,
    destructiveForeground: 'hsl(0 0% 100%)',
    border: 'hsl(210 10% 20%)',
    input: 'hsl(210 10% 20%)',
    ring: '#6B9FFF' /* Primary */,
    radius: '0.75rem' /* 12px for cards */,
    /* BabyEase brand-specific colors - Dark mode */
    mint: '#7FD4C1',
    info: '#6BA8D1',
    lavender: '#D4C9FF',
    warning: '#FF9B7A' /* Alias for destructive */,
    /* Chart colors - BabyEase brand palette (lighter for dark mode) */
    chart1: '#6B9FFF' /* Primary */,
    chart2: '#FFB86D' /* Secondary */,
    chart3: '#FF8AB8' /* Accent Pink */,
    chart4: '#7FD4C1' /* Mint */,
    chart5: '#FF9B7A' /* Warning */,
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.primary,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.primary,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
