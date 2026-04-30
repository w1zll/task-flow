import { alpha, createTheme } from '@mui/material/styles';

const palette = {
  primary: {
    main: '#6366f1', // indigo
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#f59e0b', // amber
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#ffffff',
  },
  error: { main: '#ef4444' },
  warning: { main: '#f97316' },
  success: { main: '#22c55e' },
  info: { main: '#3b82f6' },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    ...palette,
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Inter", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
        containedPrimary: {
          boxShadow: `0 4px 14px ${alpha('#6366f1', 0.4)}`,
          '&:hover': {
            boxShadow: `0 6px 20px ${alpha('#6366f1', 0.5)}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
          '&:hover': {
            boxShadow:
              '0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)',
          },
          transition: 'box-shadow 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ...palette,
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  typography: lightTheme.typography,
  shape: lightTheme.shape,
  components: {
    ...lightTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.06)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
          },
          transition: 'box-shadow 0.2s ease',
        },
      },
    },
  },
});
