import { KeyboardArrowDown } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { RefObject } from 'react';

interface Props {
  badgeRef: RefObject<HTMLDivElement>;
  titleRef: RefObject<HTMLSpanElement>;
  accentRef: RefObject<HTMLElement>;
  subtitleRef: RefObject<HTMLElement>;
  buttonsRef: RefObject<HTMLDivElement>;
  scrollArrowRef: RefObject<HTMLDivElement>;
  featuresRef: RefObject<HTMLDivElement>;
}

const Hero = ({
  badgeRef,
  titleRef,
  accentRef,
  subtitleRef,
  buttonsRef,
  scrollArrowRef,
  featuresRef,
}: Props) => {
  const t = useTranslations('HomePage.hero');
  const heading = t('heading');

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        pb: 15,
        textAlign: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? `radial-gradient(ellipse 80% 50% at 50% -10%, ${alpha(theme.palette.primary.main, 0.3)} 0%, transparent 70%), ${theme.palette.background.default}`
            : `radial-gradient(ellipse 80% 50% at 50% -10%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%), ${theme.palette.background.default}`,
      }}
    >
      <Container maxWidth="md">
        <Chip
          ref={badgeRef}
          label={t('chip')}
          size="small"
          sx={{ mb: 3, fontWeight: 500, opacity: 0 }}
        />
        <Typography
          variant="h2"
          fontWeight={800}
          sx={{
            fontSize: { xs: '2.2rem', md: '3.5rem' },
            letterSpacing: '-0.03em',
            lineHeight: 1,
            mb: 2.5,
            color: 'text.primary',
          }}
        >
          <span
            ref={titleRef}
            aria-label={heading}
            style={{ display: 'inline-block', opacity: 0 }}
          >
            {Array.from(heading).map((char, index) => (
              <span
                key={`${char}-${index}`}
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  verticalAlign: 'top',
                }}
              >
                <span data-hero-char style={{ display: 'inline-block' }}>
                  {char === ' ' ? '\u00a0' : char}
                </span>
              </span>
            ))}
          </span>
          <Box
            ref={accentRef}
            component="span"
            sx={{
              color: 'primary.main',
              display: 'inline-block',
              opacity: 0,
            }}
          >
            {t('headingAccent')}
          </Box>
        </Typography>
        <Typography
          ref={subtitleRef}
          variant="h6"
          color="text.secondary"
          fontWeight={400}
          sx={{
            mb: 5,
            maxWidth: 520,
            mx: 'auto',
            lineHeight: 1.6,
            opacity: 0,
          }}
        >
          {t('subtitle')}
        </Typography>
        <Stack
          ref={buttonsRef}
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ opacity: 0 }}
        >
          <Link href="/auth/register">
            <Button variant="contained" size="large" sx={{ px: 4, py: 1.5 }}>
              {t('ctaStart')}
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outlined" size="large" sx={{ px: 4, py: 1.5 }}>
              {t('ctaLogin')}
            </Button>
          </Link>
        </Stack>
      </Container>

      <Box
        ref={scrollArrowRef}
        onClick={() => {
          featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        sx={{
          position: 'absolute',
          bottom: 72,
          left: '50%',
          transform: 'translateX(-50%)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          color: 'text.secondary',
          '&:hover': { color: 'primary.main' },
          transition: 'color 0.2s',
        }}
      >
        <Typography variant="caption">{t('scroll')}</Typography>
        <KeyboardArrowDown sx={{ fontSize: 28 }} />
      </Box>
    </Box>
  );
};

export default Hero;
