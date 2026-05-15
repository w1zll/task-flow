'use client';

import { setLocaleAction } from '@/shared/actions/locale.action';
import { Button, ButtonGroup } from '@mui/material';
import { Locale, useLocale } from 'next-intl';
import { useTransition } from 'react';

const LocaleSwitcher = () => {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: Locale) => {
    startTransition(() => setLocaleAction(newLocale));
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
