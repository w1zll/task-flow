'use client';

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
  open: boolean;
  workspaceName: string;
  isDeleting: boolean;
  onRequestClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteWorkspaceDialog = ({
  open,
  workspaceName,
  isDeleting,
  onRequestClose,
  onCancel,
  onConfirm,
}: DeleteWorkspaceDialogProps) => {
  const t = useTranslations('WorkspaceSettings');

  return (
    <Dialog open={open} onClose={onRequestClose}>
      <DialogTitle>{t('deleteWorkspaceTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('deleteWorkspaceConfirm', {
            name: workspaceName,
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
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? t('deletingWorkspace') : t('deleteWorkspace')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteWorkspaceDialog;
