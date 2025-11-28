import { useColorScheme } from './use-color-scheme';
import { getBrandColor } from '@/lib/utils';
import { THEME } from '@/lib/theme';

/**
 * Hook to get brand colors based on current color scheme
 * Use this for native components (Slider, Icons, etc.) that require hex color values
 *
 * @example
 * ```tsx
 * const brandColors = useBrandColor();
 * <Slider minimumTrackTintColor={brandColors.accent} />
 * <MaterialCommunityIcons color={brandColors.white} />
 * ```
 */
export function useBrandColor() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const theme = THEME[scheme];

  return {
    /**
     * Get a brand color by name (automatically uses current color scheme)
     */
    get: (colorName: keyof (typeof THEME)['light']): string => {
      return getBrandColor(colorName, scheme);
    },
    /**
     * Direct access to brand colors (automatically uses current color scheme)
     * All colors come from THEME - single source of truth
     */
    colors: {
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      destructive: theme.destructive,
      mint: theme.mint,
      info: theme.info,
      lavender: theme.lavender,
      // Common semantic colors (not in THEME, but commonly needed)
      white: '#FFFFFF',
      black: '#000000',
    },
  };
}
