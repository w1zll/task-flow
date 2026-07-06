'use client';

import type { BoardLayout } from './board-layout';
import {
  CalendarMonthOutlined,
  MapOutlined,
  TimelineOutlined,
  ViewKanbanOutlined,
} from '@mui/icons-material';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface BoardLayoutSwitcherProps {
  layout: BoardLayout;
  onChange: (layout: BoardLayout) => void;
}

const BoardLayoutSwitcher = ({
  layout,
  onChange,
}: BoardLayoutSwitcherProps) => {
  const t = useTranslations('BoardPage');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color: 'text.secondary',
          fontWeight: 700,
          letterSpacing: 0,
          flexShrink: 0,
        }}
      >
        {t('layout.label')}
      </Typography>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={layout}
        onChange={(_, nextLayout: BoardLayout | null) => {
          if (nextLayout) onChange(nextLayout);
        }}
        aria-label={t('layout.label')}
        sx={{
          flexWrap: 'wrap',
          minWidth: 0,
          maxWidth: '100%',
          '& .MuiToggleButton-root': {
            px: 1.25,
            py: 0.75,
            textTransform: 'none',
            gap: 0.75,
            minWidth: 0,
            whiteSpace: 'normal',
            lineHeight: 1.2,
            overflowWrap: 'anywhere',
          },
          '& .MuiSvgIcon-root': {
            flexShrink: 0,
          },
        }}
      >
        <ToggleButton value="kanban" aria-label={t('layout.kanban')}>
          <ViewKanbanOutlined fontSize="small" />
          {t('layout.kanban')}
        </ToggleButton>
        <ToggleButton value="calendar" aria-label={t('layout.calendar')}>
          <CalendarMonthOutlined fontSize="small" />
          {t('layout.calendar')}
        </ToggleButton>
        <ToggleButton value="timeline" aria-label={t('layout.timeline')}>
          <TimelineOutlined fontSize="small" />
          {t('layout.timeline')}
        </ToggleButton>
        <ToggleButton value="roadmap" aria-label={t('layout.roadmap')}>
          <MapOutlined fontSize="small" />
          {t('layout.roadmap')}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default BoardLayoutSwitcher;
