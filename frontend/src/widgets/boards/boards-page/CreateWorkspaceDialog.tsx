'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface CreateWorkspaceDialogProps {
  open: boolean;
  workspaceName: string;
  isCreating: boolean;
  onClose: () => void;
  onWorkspaceNameChange: (name: string) => void;
  onCreate: () => void;
}

const CreateWorkspaceDialog = ({
  open,
  workspaceName,
  isCreating,
  onClose,
  onWorkspaceNameChange,
  onCreate,
}: CreateWorkspaceDialogProps) => {
  const t = useTranslations('Boards');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {t('workspaceDialogTitle')}
      </DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <TextField
          autoFocus
          fullWidth
          label={t('workspaceName')}
          value={workspaceName}
          onChange={(event) => onWorkspaceNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onCreate();
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button
          variant="contained"
          onClick={onCreate}
          disabled={!workspaceName.trim() || isCreating}
        >
          {isCreating ? t('creating') : t('create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;
