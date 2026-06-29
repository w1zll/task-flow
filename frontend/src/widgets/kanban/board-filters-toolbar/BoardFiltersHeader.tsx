'use client';

import {
  FilterListOutlined,
  RestartAltOutlined,
} from '@mui/icons-material';
import {
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface BoardFiltersHeaderProps {
  isActive: boolean;
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
  onOpenMobileDrawer: () => void;
}

const BoardFiltersHeader = ({
  isActive,
  filteredCount,
  totalCount,
  onReset,
  onOpenMobileDrawer,
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
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t('title')}
        </Typography>
        <Chip
          size="small"
          label={t('resultCount', {
            filtered: filteredCount,
            total: totalCount,
          })}
          variant="outlined"
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
      </Stack>
    </Stack>
  );
};

export default BoardFiltersHeader;
