import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { THEME } from './theme';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
