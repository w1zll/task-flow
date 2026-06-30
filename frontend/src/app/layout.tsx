import { getLocale, getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import { DM_Sans } from 'next/font/google';
import Providers from './Providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

type ThemeMode = 'light' | 'dark';

const getInitialThemeMode = async (): Promise<ThemeMode> => {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value;

  return theme === 'light' || theme === 'dark' ? theme : 'dark';
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const messages = await getMessages();
  const locale = await getLocale();
  const initialThemeMode = await getInitialThemeMode();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/taskflow-icon.svg" />
        <meta name="theme-color" content="#669266" />
      </head>
      <body className={dmSans.className}>
        <Providers
          messages={messages}
          locale={locale}
          initialThemeMode={initialThemeMode}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
