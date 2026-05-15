import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useLocale } from 'next-intl';
import { useLayoutEffect } from 'react';

export function useDayjsLocale() {
  const locale = useLocale();

  useLayoutEffect(() => {
    dayjs.locale(locale === 'ru' ? 'ru' : 'en');
  }, [locale]);
}
