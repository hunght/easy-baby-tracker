import { formatDistanceToNow } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';

import { useLocalization } from '@/localization/LocalizationProvider';
import { Locale } from '@/localization/translations';

const locales: Record<Locale, typeof enUS> = {
  en: enUS,
  vi: vi,
};

export function useRelativeTime() {
  const { locale } = useLocalization();

  const formatRelative = (date: Date | number) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: locales[locale] || enUS,
    });
  };

  return { formatRelative };
}
