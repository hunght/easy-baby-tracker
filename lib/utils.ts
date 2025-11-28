import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { THEME } from './theme';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get a brand color based on current color scheme from centralized THEME config
 * @param colorName - The name of the color from THEME (e.g., 'primary', 'accent', 'mint')
 * @param colorScheme - The color scheme ('light' | 'dark')
 * @returns The hex color value as a string
 */
export function getBrandColor(
  colorName: keyof (typeof THEME)['light'],
  colorScheme: 'light' | 'dark'
): string {
  const theme = THEME[colorScheme];
  const value = theme[colorName];
  if (typeof value === 'string') {
    return value;
  }
  return '#000000';
}
