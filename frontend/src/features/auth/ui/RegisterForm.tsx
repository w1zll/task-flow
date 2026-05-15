'use client';

import NextLink from 'next/link';
import { useAuth } from '../useAuth';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { ViewKanban } from '@mui/icons-material';

const RegisterForm = () => {
  const t = useTranslations('Auth.Register');
  const { register, isRegisterLoading } = useAuth();
  const [form, setForm] = useState({ email: '', name: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(form);
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

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
            ? `radial-gradient(ellipse at 70% 20%, ${alpha('#6366f1', 0.15)} 0%, transparent 60%)`
            : undefined,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, p: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
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
            <Typography variant="h5" fontWeight={700}>
              TaskFlow
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={700} gutterBottom>
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
              label={t('name')}
              required
              fullWidth
              autoComplete="name"
              {...field('name')}
            />
            <TextField
              label={t('email')}
              type="email"
              required
              fullWidth
              autoComplete="email"
              {...field('email')}
            />
            <TextField
              label={t('password')}
              type="password"
              required
              fullWidth
              autoComplete="new-password"
              inputProps={{
                minLength: 6,
              }}
              {...field('password')}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isRegisterLoading}
              sx={{ mt: 1, py: 1.5 }}
            >
              {isRegisterLoading ? t('loading') : t('submit')}
            </Button>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 3 }}
          >
            {t('haveAccount')}{' '}
            <Link component={NextLink} href="/auth/login" fontWeight={600}>
              {t('login')}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterForm;
