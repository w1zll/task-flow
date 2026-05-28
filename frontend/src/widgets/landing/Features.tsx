import {
  alpha,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import React, { ReactNode, RefObject } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

interface Props {
  features: Feature[];
  featuresRef: RefObject<HTMLDivElement>;
  featuresTitleRef: RefObject<HTMLElement>;
  featuresSubtitleRef: RefObject<HTMLElement>;
  cardsRef: RefObject<HTMLDivElement[]>;
}

const Features = ({
  features,
  featuresRef,
  featuresTitleRef,
  featuresSubtitleRef,
  cardsRef,
}: Props) => {
  const t = useTranslations('HomePage.features');

  return (
    <Container ref={featuresRef} maxWidth="lg" sx={{ pb: 12, pt: 8 }}>
      <Typography
        ref={featuresTitleRef}
        variant="h4"
        fontWeight={700}
        textAlign="center"
        sx={{ mb: 1, opacity: 0 }}
      >
        {t('heading')}
      </Typography>
      <Typography
        ref={featuresSubtitleRef}
        variant="body1"
        color="text.secondary"
        textAlign="center"
        sx={{ mb: 6, opacity: 0 }}
      >
        {t('subheading')}
      </Typography>

      <Grid container spacing={3}>
        {features.map((f, i) => (
          <Grid item xs={12} sm={6} md={4} key={f.title}>
            <Card
              ref={(el) => {
                if (el) cardsRef.current![i] = el as HTMLDivElement;
              }}
              sx={{
                height: '100%',
                p: 0.5,
                opacity: 0,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
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
  );
};

export default Features;
