'use client';

import type { WorkspaceMember } from '@/shared/api/api';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface RemoveWorkspaceMemberDialogProps {
  member?: WorkspaceMember;
  isRemoving: boolean;
  onRequestClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const RemoveWorkspaceMemberDialog = ({
  member,
  isRemoving,
  onRequestClose,
  onCancel,
  onConfirm,
}: RemoveWorkspaceMemberDialogProps) => {
  const t = useTranslations('WorkspaceSettings');

  return (
    <Dialog open={Boolean(member)} onClose={onRequestClose}>
      <DialogTitle>{t('removeMemberTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('removeMemberConfirm', {
            name: member?.user.name ?? '',
          })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={isRemoving} onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={!member || isRemoving}
          onClick={onConfirm}
        >
          {isRemoving ? t('removingMember') : t('removeMember')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveWorkspaceMemberDialog;
