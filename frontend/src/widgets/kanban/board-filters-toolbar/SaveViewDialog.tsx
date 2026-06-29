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

interface SaveViewDialogProps {
  open: boolean;
  title: string;
  isSaving: boolean;
  onClose: () => void;
  onTitleChange: (title: string) => void;
  onSave: () => void;
}

const SaveViewDialog = ({
  open,
  title,
  isSaving,
  onClose,
  onTitleChange,
  onSave,
}: SaveViewDialogProps) => {
  const t = useTranslations('BoardPage.filters');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('views.saveTitle')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label={t('views.name')}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSave();
            }
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('views.cancel')}</Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!title.trim() || isSaving}
        >
          {t('views.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveViewDialog;
