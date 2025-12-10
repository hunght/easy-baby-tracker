import * as ExpoLocalization from 'expo-localization';
import { ReactNode, createContext, useContext, useMemo, useState } from 'react';

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

const translateKey = (locale: Locale, key: string, options?: TranslateOptions): string => {
  const localized = resolveTemplate(key, locale);
  const fallback = resolveTemplate(key, fallbackLocale);
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
