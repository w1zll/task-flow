'use client';

import { useAuth } from '@/features/auth/useAuth';
import { useThemeStore } from '@/shared/store/root.store';
import type { ThemeMode } from '@/shared/store/theme.store';
import {
  DarkMode,
  LightMode,
  Logout,
  ViewKanban,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Skeleton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import NextLink from 'next/link';
import LocaleSwitcher from './LocaleSwitcher';
import UserAvatar from '@/shared/ui/UserAvatar';
import WorkspaceSwitcher from './WorkspaceSwitcher';

const AppHeader = ({
  initialThemeMode,
}: {
  initialThemeMode: ThemeMode;
}) => {
  const t = useTranslations('Header');
  const { user, logout, isLoading } = useAuth();
  const themeStore = useThemeStore();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const themeMode = themeStore.hasHydrated
    ? themeStore.mode
    : initialThemeMode;
  const isDark = themeMode === 'dark';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 2, md: 4 },
            minWidth: 0,
          }}
        >
          <Link
            component={NextLink}
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '6px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ViewKanban
                sx={{ color: 'primary.contrastText', fontSize: 18 }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                display: { xs: 'none', md: 'block' },
                letterSpacing: '-0.02em',
                fontWeight: 700,
              }}
            >
              TaskFlow
            </Typography>
          </Link>

          <Link
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 18,
              ':hover': { textDecoration: 'underline' },
            }}
            component={NextLink}
            href="/boards"
          >
            {t('myBoards')}
          </Link>
          {user && <WorkspaceSwitcher />}
        </Box>

        <Box sx={{ display: 'flex', marginLeft: 'auto', gap: 1 }}>
          <LocaleSwitcher />
          <Tooltip title={isDark ? t('lightTheme') : t('darkTheme')}>
            <IconButton onClick={() => themeStore.toggle(themeMode)}>
              {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
          {!isLoading ? (
            !user ? (
              <Button
                component={NextLink}
                variant="contained"
                href="/auth/login"
                sx={{
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {t('signIn')}
              </Button>
            ) : (
              <Tooltip title={user?.name ?? 'Account'}>
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ p: 0.5 }}
                >
                  <UserAvatar
                    name={user.name}
                    src={user.avatar}
                    size={34}
                  />
                </IconButton>
              </Tooltip>
            )
          ) : (
            <Skeleton
              variant="circular"
              width={34}
              height={34}
              sx={{
                fontSize: 13,
                fontWeight: 700,
                margin: 0.5,
              }}
            />
          )}

          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              component={NextLink}
              href="/profile"
              onClick={() => setAnchorEl(null)}
              sx={{ gap: 1 }}
            >
              {t('profile')}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                logout();
              }}
              sx={{ color: 'error.main', gap: 1 }}
            >
              <Logout fontSize="small" /> {t('logout')}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
