'use client';

import AuthHydrator from '@/features/auth/AuthHydrator';
import { getRootStore, StoreContext } from '@/shared/store/root.store';
import { darkTheme, lightTheme } from '@/shared/theme/theme';
import AppHeader from '@/widgets/layout/AppHeader';
import { ThemeProvider } from '@emotion/react';
import { Box, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { observer } from 'mobx-react-lite';
import { Locale, NextIntlClientProvider } from 'next-intl';
import { SnackbarProvider } from 'notistack';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootStore = getRootStore();

const ThemedApp = observer(({ children }: { children: React.ReactNode }) => {
  const theme = rootStore.theme.isDark ? darkTheme : lightTheme;

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
});

const Providers = ({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: any;
  locale: Locale;
}) => {
  return (
    <StoreContext.Provider value={rootStore}>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemedApp>
            <Box sx={{ minHeight: '100vh' }}>
              <AppHeader />
              {children}
            </Box>
          </ThemedApp>
        </NextIntlClientProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StoreContext.Provider>
  );
};

export default Providers;
