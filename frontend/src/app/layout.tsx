import { getLocale, getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import Providers from './Providers';

type ThemeMode = 'light' | 'dark';

const getInitialThemeMode = (): ThemeMode => {
  const theme = cookies().get('theme')?.value;

  return theme === 'light' || theme === 'dark' ? theme : 'dark';
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const messages = await getMessages();
  const locale = await getLocale();
  const initialThemeMode = getInitialThemeMode();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
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
