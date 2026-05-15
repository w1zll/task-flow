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

const FEATURES = [
  {
    icon: <DragIndicator />,
    title: 'Drag & Drop',
    desc: 'Перемещайте задачи между столбцами с помощью drag & drop. Меняйте порядок столбцов за считанные секунды.',
  },
  {
    icon: <Speed />,
    title: 'Невероятно быстро',
    desc: 'Благодаря оптимистичным обновлениям пользовательский интерфейс работает мгновенно. Не нужно ждать ответа от сервера.',
  },
  {
    icon: <Security />,
    title: 'Авторизация',
    desc: 'JWT-токены хранятся в файлах cookie httpOnly. Автоматическое бесшумное обновление позволяет оставаться авторизованным.',
  },
  {
    icon: <Palette />,
    title: 'Пользовательские темы',
    desc: 'Темная и светлая темы с красивой пользовательской палитрой Material UI.',
  },
  {
    icon: <ViewKanban />,
    title: 'Несколько досок',
    desc: 'Создавайте столько досок, сколько вам нужно. Используйте цветовую кодировку для удобной навигации.',
  },
  {
    icon: <Devices />,
    title: 'SSR + ISR',
    desc: 'Next.js (App Router) приложение с Server Side Rendering(SSR) и Incremental Static Regeneration(ISR).',
  },
];

const LandingClient = observer(() => {
  const t = useTranslations('HomePage');

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
            label="Built with Next.js · NestJS · MobX · TanStack Query"
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
            Управляйте задачами с{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              легкостью
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            fontWeight={400}
            sx={{ mb: 5, maxWidth: 520, mx: 'auto', lineHeight: 1.6 }}
          >
            <span style={{ color: 'red' }}>{t('title')}</span>
            <br />
            TaskFlow - это прекрасная Kanban доска, которая помогает
            организовать работу, отслеживать прогресс, и быстрее решать важные
            задачи.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Link href="/auth/register">
              <Button
                variant="contained"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Начать
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="outlined"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Войти
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
          Все что вам надо
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 6 }}
        >
          Fullstack пет-проект NestJS + Next.js + TypeScript
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
          TaskFlow - Next.js · NestJS · MobX · Material UI
        </Typography>
      </Box>
    </Box>
  );
});

export default LandingClient;
