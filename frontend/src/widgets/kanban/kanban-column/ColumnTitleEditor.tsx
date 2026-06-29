'use client';

import { Check, Close } from '@mui/icons-material';
import { Box, IconButton, TextField } from '@mui/material';

interface ColumnTitleEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const ColumnTitleEditor = ({
  value,
  onChange,
  onSubmit,
  onCancel,
}: ColumnTitleEditorProps) => (
  <TextField
    autoFocus
    size="small"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    onKeyDown={(event) => {
      if (event.key === 'Enter') onSubmit();
      if (event.key === 'Escape') onCancel();
    }}
    sx={{ flex: 1, mr: 1 }}
    slotProps={{
      htmlInput: { style: { fontWeight: 600 } },
      input: {
        endAdornment: (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <IconButton
              size="small"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onSubmit}
            >
              <Check fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onCancel}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    }}
  />
);

export default ColumnTitleEditor;
