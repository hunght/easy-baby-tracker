// Re-export from domain-specific translation files
// Legacy exports for backward compatibility
import { translationObject, type Locale } from './translations/index';

export { supportedLocales, translationObject } from './translations/index';
export type { Locale } from './translations/index';
export const translations = translationObject;
export type TranslationTree = (typeof translationObject)[Locale];
