'use server';

import { Locale } from 'next-intl';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function setLocaleAction(locale: Locale) {
  cookies().set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
}
