'use client'

import { useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import { alpha, Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, Link, TextField, Typography } from "@mui/material";
import { ViewKanban, Visibility, VisibilityOff } from "@mui/icons-material";
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import {
  capturePendingWorkspaceInviteFromLocation,
  getInviteAuthHref,
} from '@/shared/lib/pending-workspace-invite';

const LoginForm = () => {
  const t = useTranslations('Auth.Login');
  const { login, isLoginLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    setInviteToken(capturePendingWorkspaceInviteFromLocation());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? `radial-gradient(ellipse at 30% 20%, ${alpha('#6366f1', 0.15)} 0%, transparent 60%),
            radial-gradient(ellipse at 70% 80%, ${alpha('#f59e0b', 0.08)} 0%, transparent 60%),`
            : `redial-gradient(ellipse at 30% 20%, ${alpha('#6366f1', 0.15)} 0%, transparent 60%),`,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, p: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 4 }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ViewKanban sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Typography variant="h5">TaskFlow</Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
            {t('heading')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('subtitle')}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label={t('email')}
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              required
              fullWidth
              autoComplete="email"
            />
            <TextField
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              required
              fullWidth
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoginLoading}
              sx={{ mt: 1, py: 1.5 }}
            >
              {isLoginLoading ? t('loading') : t('submit')}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            {t('noAccount')}{' '}
            <Link
              component={NextLink}
              href={getInviteAuthHref('/auth/register', inviteToken)}
              sx={{ fontWeight: 600 }}
            >
              {t('register')}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;
