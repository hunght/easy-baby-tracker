import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const nativewindColorScheme = useNativewindColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY)
      .then((saved: string | null) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
        setIsHydrated(true);
      })
      .catch(() => {
        setIsHydrated(true);
      });
  }, []);

  // Persist theme preference
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, mode).catch(console.error);
  };

  // Determine effective color scheme
  const colorScheme: ColorScheme =
    themeMode === 'system' ? (deviceColorScheme === 'dark' ? 'dark' : 'light') : themeMode;

  const isDark = colorScheme === 'dark';

  // Keep NativeWind's internal color scheme aligned with our provider so classnames stay in sync.
  useEffect(() => {
    const targetScheme = colorScheme;
    if (nativewindColorScheme?.colorScheme !== targetScheme) {
      nativewindColorScheme?.setColorScheme(targetScheme);
    }
  }, [colorScheme, nativewindColorScheme]);

  // Apply dark class to document root for web
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark]);

  // Don't render until theme is loaded
  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
