'use client';

import {
  Devices,
  DragIndicator,
  Palette,
  Security,
  Speed,
  ViewKanban,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './Hero';
import Features from './Features';
import { useLandingGSAP } from './hooks/useLandingGSAP';

gsap.registerPlugin(useGSAP, ScrollTrigger);

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

  const refs = useLandingGSAP();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Hero
        badgeRef={refs.badgeRef}
        titleRef={refs.titleRef}
        accentRef={refs.accentRef}
        subtitleRef={refs.subtitleRef}
        buttonsRef={refs.buttonsRef}
        scrollArrowRef={refs.scrollArrowRef}
        featuresRef={refs.featuresRef}
      />
      <Features
        features={FEATURES}
        featuresRef={refs.featuresRef}
        featuresTitleRef={refs.featuresTitleRef}
        featuresSubtitleRef={refs.featuresSubtitleRef}
        cardsRef={refs.cardsRef}
      />
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
