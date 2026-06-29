'use client';

import {
  ExpandMoreOutlined,
  FilterListOutlined,
  RestartAltOutlined,
} from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface BoardFiltersHeaderProps {
  isActive: boolean;
  filteredCount: number;
  totalCount: number;
  isFiltering: boolean;
  isDesktopExpanded: boolean;
  desktopPanelId: string;
  onReset: () => void;
  onOpenMobileDrawer: () => void;
  onToggleDesktopExpanded: () => void;
}

const BoardFiltersHeader = ({
  isActive,
  filteredCount,
  totalCount,
  isFiltering,
  isDesktopExpanded,
  desktopPanelId,
  onReset,
  onOpenMobileDrawer,
  onToggleDesktopExpanded,
}: BoardFiltersHeaderProps) => {
  const t = useTranslations('BoardPage.filters');

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', justifyContent: 'space-between' }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', minWidth: 0 }}
      >
        <FilterListOutlined color="primary" fontSize="small" />
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
        >
          {t('summary', {
            filtered: filteredCount,
            total: totalCount,
          })}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {isFiltering && (
          <CircularProgress
            size={16}
            thickness={5}
            aria-label={t('loadingResults')}
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          />
        )}
        {isActive && (
          <IconButton
            size="small"
            onClick={onReset}
            aria-label={t('reset')}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <RestartAltOutlined fontSize="small" />
          </IconButton>
        )}
        <Button
          size="small"
          variant={isActive ? 'contained' : 'outlined'}
          startIcon={<FilterListOutlined />}
          onClick={onOpenMobileDrawer}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          {t('open')}
        </Button>
        <Tooltip
          title={t(isDesktopExpanded ? 'collapse' : 'expand')}
          describeChild
        >
          <IconButton
            size="small"
            onClick={onToggleDesktopExpanded}
            aria-label={t(isDesktopExpanded ? 'collapse' : 'expand')}
            aria-controls={desktopPanelId}
            aria-expanded={isDesktopExpanded}
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              transition: 'transform 160ms ease',
              transform: isDesktopExpanded
                ? 'rotate(180deg)'
                : 'rotate(0deg)',
            }}
          >
            <ExpandMoreOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

export default BoardFiltersHeader;
