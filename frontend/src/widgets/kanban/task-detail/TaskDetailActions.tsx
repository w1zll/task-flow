'use client';

import { Delete, Save } from '@mui/icons-material';
import { Box, Button, DialogActions, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';

interface TaskDetailActionsProps {
  canEdit: boolean;
  isDirty: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}

const TaskDetailActions = ({
  canEdit,
  isDirty,
  isUpdating,
  onClose,
  onDelete,
  onSave,
}: TaskDetailActionsProps) => {
  const t = useTranslations('TaskDetail');

  return (
    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
      {canEdit ? (
        <Button
          color="error"
          startIcon={<Delete />}
          onClick={onDelete}
          size="small"
        >
          {t('deleteTask')}
        </Button>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('readOnly')}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button onClick={onClose} size="small">
          {canEdit ? t('cancel') : t('close')}
        </Button>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={onSave}
            disabled={!isDirty || isUpdating}
            size="small"
          >
            {isUpdating ? t('saving') : t('save')}
          </Button>
        )}
      </Box>
    </DialogActions>
  );
};

export default TaskDetailActions;
