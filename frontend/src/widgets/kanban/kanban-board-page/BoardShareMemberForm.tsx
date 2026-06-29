'use client';

import type { WorkspaceMember } from '@/shared/api/api';
import UserAvatar from '@/shared/ui/UserAvatar';
import { PersonAddAltOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface BoardShareMemberFormProps {
  availableWorkspaceMembers: WorkspaceMember[];
  shareUserId: string;
  shareRole: 'editor' | 'viewer';
  isShareMembersLoading: boolean;
  isShareMembersError: boolean;
  isSharePending: boolean;
  isShareError: boolean;
  onShareUserIdChange: (userId: string) => void;
  onShareRoleChange: (role: 'editor' | 'viewer') => void;
  onShareBoard: () => void;
}

const BoardShareMemberForm = ({
  availableWorkspaceMembers,
  shareUserId,
  shareRole,
  isShareMembersLoading,
  isShareMembersError,
  isSharePending,
  isShareError,
  onShareUserIdChange,
  onShareRoleChange,
  onShareBoard,
}: BoardShareMemberFormProps) => {
  const t = useTranslations('BoardPage');

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.default',
        borderRadius: '6px',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <PersonAddAltOutlined color="primary" fontSize="small" />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t('addMember')}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('shareDescription')}
      </Typography>

      <Stack spacing={1.5}>
        <FormControl size="small" fullWidth>
          <InputLabel>{t('shareMember')}</InputLabel>
          <Select
            label={t('shareMember')}
            value={shareUserId}
            onChange={(event) => onShareUserIdChange(event.target.value)}
            disabled={
              isShareMembersLoading || availableWorkspaceMembers.length === 0
            }
            renderValue={(value) => {
              const selectedMember = availableWorkspaceMembers.find(
                (member) => member.userId === value,
              );
              if (!selectedMember) return '';

              return (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <UserAvatar
                    name={selectedMember.user.name}
                    src={selectedMember.user.avatar}
                    size={24}
                  />
                  <Typography variant="body2" noWrap>
                    {selectedMember.user.name}
                  </Typography>
                </Stack>
              );
            }}
          >
            {availableWorkspaceMembers.map((member) => (
              <MenuItem key={member.userId} value={member.userId}>
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: 'center', minWidth: 0 }}
                >
                  <UserAvatar
                    name={member.user.name}
                    src={member.user.avatar}
                    size={30}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {member.user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {member.user.email}
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{t('memberRole')}</InputLabel>
            <Select
              label={t('memberRole')}
              value={shareRole}
              onChange={(event) =>
                onShareRoleChange(event.target.value as 'editor' | 'viewer')
              }
            >
              <MenuItem value="editor">{t('roleEditor')}</MenuItem>
              <MenuItem value="viewer">{t('roleViewer')}</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<PersonAddAltOutlined />}
            onClick={onShareBoard}
            disabled={isSharePending || isShareMembersLoading || !shareUserId}
            sx={{ flex: 1 }}
          >
            {t('addMember')}
          </Button>
        </Stack>
      </Stack>

      {isShareMembersLoading && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          {t('shareMembersLoading')}
        </Typography>
      )}
      {!isShareMembersLoading &&
        !isShareMembersError &&
        availableWorkspaceMembers.length === 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            {t('shareNoAvailableMembers')}
          </Typography>
        )}
      {isShareMembersError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: 'block', mt: 1 }}
        >
          {t('shareMembersError')}
        </Typography>
      )}
      {isShareError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: 'block', mt: 1 }}
        >
          {t('shareError')}
        </Typography>
      )}
    </Box>
  );
};

export default BoardShareMemberForm;
