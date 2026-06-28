'use client';

import {
  AccountTree,
  Analytics,
  DashboardCustomize,
  FilterAlt,
  Groups,
  PendingActions,
  Security,
  SyncAlt,
  ViewKanban,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './Hero';
import Features from './Features';
import { useLandingGSAP } from './hooks/useLandingGSAP';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LandingClient = () => {
  const t = useTranslations('HomePage');

  const FEATURES = [
    {
      id: 'workspaces',
      icon: <AccountTree />,
      title: t('features.workspaces.title'),
      desc: t('features.workspaces.desc'),
    },
    {
      id: 'boards',
      icon: <ViewKanban />,
      title: t('features.boards.title'),
      desc: t('features.boards.desc'),
    },
    {
      id: 'teams',
      icon: <Groups />,
      title: t('features.teams.title'),
      desc: t('features.teams.desc'),
    },
    {
      id: 'permissions',
      icon: <Security />,
      title: t('features.permissions.title'),
      desc: t('features.permissions.desc'),
    },
    {
      id: 'templates',
      icon: <DashboardCustomize />,
      title: t('features.templates.title'),
      desc: t('features.templates.desc'),
    },
    {
      id: 'views',
      icon: <FilterAlt />,
      title: t('features.views.title'),
      desc: t('features.views.desc'),
    },
    {
      id: 'realtime',
      icon: <SyncAlt />,
      title: t('features.realtime.title'),
      desc: t('features.realtime.desc'),
    },
    {
      id: 'analytics',
      icon: <Analytics />,
      title: t('features.analytics.title'),
      desc: t('features.analytics.desc'),
    },
    {
      id: 'pending-changes',
      icon: <PendingActions />,
      title: t('features.pendingChanges.title'),
      desc: t('features.pendingChanges.desc'),
    },
    {
      id: 'auth',
      icon: <Security />,
      title: t('features.auth.title'),
      desc: t('features.auth.desc'),
    },
  ];

  const refs = useLandingGSAP();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
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
};

export default LandingClient;
