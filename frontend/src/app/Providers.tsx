'use client';

import AuthHydrator from '@/features/auth/AuthHydrator';
import { defaultTimeZone } from '@/i18n/config';
import { useThemeStore } from '@/shared/store/root.store';
import type { ThemeMode } from '@/shared/store/theme.store';
import { darkTheme, lightTheme } from '@/shared/theme/theme';
import AppHeader from '@/widgets/layout/AppHeader';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Locale, NextIntlClientProvider } from 'next-intl';
import { SnackbarProvider } from 'notistack';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ThemedApp = ({
  children,
  initialThemeMode,
}: {
  children: React.ReactNode;
  initialThemeMode: ThemeMode;
}) => {
  const mode = useThemeStore((state) => state.mode);
  const hasHydrated = useThemeStore((state) => state.hasHydrated);
  const initialize = useThemeStore((state) => state.initialize);
  const resolvedMode = hasHydrated ? mode : initialThemeMode;
  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    initialize(initialThemeMode);
  }, [initialize, initialThemeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <AuthHydrator />
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  );
};

const Providers = ({
  children,
  messages,
  locale,
  initialThemeMode,
}: {
  children: React.ReactNode;
  messages: any;
  locale: Locale;
  initialThemeMode: ThemeMode;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={defaultTimeZone}
      >
        <ThemedApp initialThemeMode={initialThemeMode}>
          <Box sx={{ minHeight: '100vh' }}>
            <AppHeader initialThemeMode={initialThemeMode} />
            {children}
          </Box>
        </ThemedApp>
      </NextIntlClientProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default Providers;
