'use client';

import { Button, Divider, Drawer, Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface BoardFiltersMobileDrawerProps {
  open: boolean;
  isActive: boolean;
  children: ReactNode;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}

const BoardFiltersMobileDrawer = ({
  open,
  isActive,
  children,
  onClose,
  onReset,
  onApply,
}: BoardFiltersMobileDrawerProps) => {
  const t = useTranslations('BoardPage.filters');
  const titleId = 'board-filters-mobile-drawer-title';

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          sx: {
            p: 2,
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            bgcolor: 'background.paper',
          },
        },
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography id={titleId} variant="h6" sx={{ fontWeight: 700 }}>
            {t('title')}
          </Typography>
          {isActive && (
            <Button size="small" onClick={onReset}>
              {t('reset')}
            </Button>
          )}
        </Stack>
        <Divider />
        {children}
        <Button variant="contained" onClick={onApply}>
          {t('apply')}
        </Button>
      </Stack>
    </Drawer>
  );
};

export default BoardFiltersMobileDrawer;
