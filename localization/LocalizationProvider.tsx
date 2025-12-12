import * as ExpoLocalization from 'expo-localization';
import { useSegments } from 'expo-router';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { Locale, translations } from './translations';
import { supportedLocales } from './translations/index';

type TranslateParams = Record<string, string | number>;

type TranslateOptions = {
  params?: TranslateParams;
  defaultValue?: string;
};

type LocalizationContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: TranslateOptions) => string;
  availableLocales: readonly { code: Locale; label: string }[];
};

const fallbackLocale: Locale = 'en';

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

const resolveTemplate = (key: string, locale: Locale): unknown => {
  return key.split('.').reduce<unknown>((acc, segment) => {
    if (isRecord(acc) && segment in acc) {
      return acc[segment];
    }
    return undefined;
  }, translations[locale]);
};

const interpolate = (template: string, params?: TranslateParams) => {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined || value === null ? '' : String(value);
  });
};

// Track current page/route for better error context
let currentPage = 'unknown';

export function setCurrentPageForTranslation(page: string) {
  currentPage = page;
}

const translateKey = (locale: Locale, key: string, options?: TranslateOptions): string => {
  const localized = resolveTemplate(key, locale);
  const fallback = resolveTemplate(key, fallbackLocale);

  // Log missing translations for debugging
  if (typeof localized !== 'string') {
    if (typeof fallback === 'string') {
      // Translation exists in fallback but not in current locale
      console.warn(
        `[Translation] Missing key "${key}" for locale "${locale}" on page "${currentPage}", using fallback "${fallbackLocale}"`
      );
    } else if (!options?.defaultValue) {
      // Translation doesn't exist in any locale and no defaultValue provided
      console.error(
        `[Translation] Missing key "${key}" for locale "${locale}" and fallback "${fallbackLocale}" on page "${currentPage}". Using key as fallback.`
      );
    }
  }

  const template =
    (typeof localized === 'string' && localized) ||
    (typeof fallback === 'string' && fallback) ||
    options?.defaultValue ||
    key;

  return interpolate(template, options?.params);
};

const detectInitialLocale = (): Locale => {
  const detected = ExpoLocalization.getLocales()[0]?.languageCode?.toLowerCase();
  const supported = supportedLocales.find((item) => item.code === detected);
  return supported?.code ?? fallbackLocale;
};

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectInitialLocale);
  const segments = useSegments();

  // Update current page for translation logging
  useEffect(() => {
    const pagePath = segments.length > 0 ? `/${segments.join('/')}` : '/';
    setCurrentPageForTranslation(pagePath);
    console.log(`[Page] Opened: ${pagePath} (locale: ${locale})`);
  }, [segments, locale]);

  const value = useMemo<LocalizationContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, options) => translateKey(locale, key, options),
      availableLocales: supportedLocales,
    }),
    [locale]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}
