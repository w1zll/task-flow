'use client';

import type { Workspace } from '@/shared/api/api';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface DeleteWorkspaceDialogProps {
  workspace?: Workspace;
  isDeleting: boolean;
  onRequestClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteWorkspaceDialog = ({
  workspace,
  isDeleting,
  onRequestClose,
  onCancel,
  onConfirm,
}: DeleteWorkspaceDialogProps) => {
  const t = useTranslations('Boards');

  return (
    <Dialog open={Boolean(workspace)} onClose={onRequestClose}>
      <DialogTitle>{t('deleteWorkspaceTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('deleteWorkspaceConfirm', {
            name: workspace?.name ?? '',
          })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={isDeleting} onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={!workspace || isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? t('deletingWorkspace') : t('deleteWorkspace')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteWorkspaceDialog;
