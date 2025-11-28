import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { THEME } from './theme';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get a brand color based on current color scheme from centralized THEME config
 */
export function getBrandColor(
  colorName: keyof (typeof THEME)['light'],
  colorScheme: 'light' | 'dark'
): string {
  return (THEME[colorScheme][colorName as keyof (typeof THEME)['light']] || '#000000') as string;
}
