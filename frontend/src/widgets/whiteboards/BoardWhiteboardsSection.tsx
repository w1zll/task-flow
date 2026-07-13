'use client';

import type { Whiteboard } from '@/shared/api/api';
import {
  Add,
  GestureOutlined,
  LinkOutlined,
  OpenInNewOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';

interface Props {
  linkedWhiteboards: Whiteboard[];
  isError: boolean;
  canCreateOrAttach: boolean;
  onOpenWhiteboard: (whiteboardId: string) => void;
  onAttach: () => void;
  onCreate: () => void;
}

const BoardWhiteboardsSection = ({
  linkedWhiteboards,
  isError,
  canCreateOrAttach,
  onOpenWhiteboard,
  onAttach,
  onCreate,
}: Props) => {
  const t = useTranslations('Whiteboards');

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'block' },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 2,
        py: 1.25,
        flexShrink: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{ alignItems: 'center', minWidth: 0 }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', minWidth: 0, flexShrink: 0 }}
        >
          <GestureOutlined color="primary" fontSize="small" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t('boardSectionTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('boardSectionDescription')}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flex: 1, minWidth: 0, flexWrap: 'wrap' }}
        >
          {linkedWhiteboards.map((whiteboard) => (
            <Chip
              key={whiteboard.id}
              clickable
              color={
                whiteboard.capabilities.canDrawWhiteboard
                  ? 'primary'
                  : 'default'
              }
              variant="outlined"
              icon={<OpenInNewOutlined />}
              label={whiteboard.title}
              onClick={() => onOpenWhiteboard(whiteboard.id)}
              sx={{ maxWidth: 280 }}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            size="small"
            startIcon={<LinkOutlined />}
            disabled={!canCreateOrAttach}
            onClick={onAttach}
          >
            {t('attach')}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Add />}
            disabled={!canCreateOrAttach}
            onClick={onCreate}
          >
            {t('create')}
          </Button>
        </Stack>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {t('loadError')}
        </Alert>
      )}
    </Box>
  );
};

export default BoardWhiteboardsSection;
