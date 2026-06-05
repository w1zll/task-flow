'use client';

import { setLocaleAction } from '@/shared/actions/locale.action';
import { Button, ButtonGroup } from '@mui/material';
import { Locale, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const LocaleSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: Locale) => {
    startTransition(async () => {
      await setLocaleAction(newLocale);
      router.refresh();
    });
  };

  return (
    <ButtonGroup size="small" disabled={isPending}>
      <Button
        variant={locale === 'en' ? 'contained' : 'outlined'}
        onClick={() => handleChange('en')}
      >
        EN
      </Button>
      <Button
        variant={locale === 'ru' ? 'contained' : 'outlined'}
        onClick={() => handleChange('ru')}
      >
        RU
      </Button>
    </ButtonGroup>
  );
};

export default LocaleSwitcher;
