'use client';

import {
  Devices,
  DragIndicator,
  Palette,
  Security,
  Speed,
  ViewKanban,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const LandingClient = observer(() => {
  const t = useTranslations('HomePage');

  const FEATURES = [
    {
      icon: <DragIndicator />,
      title: t('features.dragDrop.title'),
      desc: t('features.dragDrop.desc'),
    },
    {
      icon: <Speed />,
      title: t('features.fast.title'),
      desc: t('features.fast.desc'),
    },
    {
      icon: <Security />,
      title: t('features.auth.title'),
      desc: t('features.auth.desc'),
    },
    {
      icon: <Palette />,
      title: t('features.themes.title'),
      desc: t('features.themes.desc'),
    },
    {
      icon: <ViewKanban />,
      title: t('features.boards.title'),
      desc: t('features.boards.desc'),
    },
    {
      icon: <Devices />,
      title: t('features.ssr.title'),
      desc: t('features.ssr.desc'),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          pt: { xs: 8, md: 14 },
          pb: { xs: 8, md: 12 },
          textAlign: 'center',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? `radial-gradient(ellipse 80% 50% at 50% -10%, ${alpha('#6366f1', 0.3)} 0%, transparent 70%)`
              : `radial-gradient(ellipse 80% 50% at 50% -10%, ${alpha('#6366f1', 0.12)} 0%, transparent 70%)`,
        }}
      >
        <Container maxWidth="md">
          <Chip
            label={t('hero.chip')}
            size="small"
            sx={{ mb: 3, fontWeight: 500 }}
          />
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              mb: 2.5,
            }}
          >
            {t('hero.heading')}
            <Box component="span" sx={{ color: 'primary.main' }}>
              {t('hero.headingAccent')}
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            fontWeight={400}
            sx={{ mb: 5, maxWidth: 520, mx: 'auto', lineHeight: 1.6 }}
          >
            {t('hero.subtitle')}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Link href="/auth/register">
              <Button variant="contained" size="large" sx={{ px: 4, py: 1.5 }}>
                {t('hero.ctaStart')}
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outlined" size="large" sx={{ px: 4, py: 1.5 }}>
                {t('hero.ctaLogin')}
              </Button>
            </Link>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 12 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          sx={{ mb: 1 }}
        >
          {t('features.heading')}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 6 }}
        >
          {t('features.subheading')}
        </Typography>

        <Grid container spacing={3}>
          {FEATURES.map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f.title}>
              <Card
                sx={{
                  height: '100%',
                  p: 0.5,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {f.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {f.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('footer')}
        </Typography>
      </Box>
    </Box>
  );
});

export default LandingClient;
