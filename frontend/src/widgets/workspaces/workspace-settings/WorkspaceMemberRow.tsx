'use client';

import type { WorkspaceMember } from '@/shared/api/api';
import UserAvatar from '@/shared/ui/UserAvatar';
import { DeleteOutlined, Person } from '@mui/icons-material';
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface WorkspaceMemberRowProps {
  member: WorkspaceMember;
  currentUserId?: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  isUpdatingRole: boolean;
  onChangeRole: (memberId: string, role: 'admin' | 'member') => void;
  onRemove: (memberId: string) => void;
}

const WorkspaceMemberRow = ({
  member,
  currentUserId,
  currentUserRole,
  isUpdatingRole,
  onChangeRole,
  onRemove,
}: WorkspaceMemberRowProps) => {
  const t = useTranslations('WorkspaceSettings');
  const canChangeRole = currentUserRole === 'owner' && member.role !== 'owner';
  const canRemove =
    member.role !== 'owner' &&
    member.userId !== currentUserId &&
    (currentUserRole === 'owner' ||
      (currentUserRole === 'admin' && member.role === 'member'));

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <UserAvatar
        name={member.user.name}
        src={member.user.avatar}
        size={38}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {member.user.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {member.user.email}
        </Typography>
      </Box>

      {canChangeRole ? (
        <FormControl size="small" sx={{ minWidth: 138 }}>
          <InputLabel id={`member-role-${member.id}`}>
            {t('memberRole')}
          </InputLabel>
          <Select
            labelId={`member-role-${member.id}`}
            label={t('memberRole')}
            value={member.role}
            disabled={isUpdatingRole}
            onChange={(event) =>
              onChangeRole(
                member.id,
                event.target.value as 'admin' | 'member',
              )
            }
          >
            <MenuItem value="admin">{t('role.admin')}</MenuItem>
            <MenuItem value="member">{t('role.member')}</MenuItem>
          </Select>
        </FormControl>
      ) : (
        <Chip
          icon={<Person />}
          size="small"
          variant="outlined"
          label={t(`role.${member.role}`)}
        />
      )}

      {canRemove && (
        <Tooltip title={t('removeMember')}>
          <IconButton
            color="error"
            aria-label={t('removeMember')}
            onClick={() => onRemove(member.id)}
          >
            <DeleteOutlined />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default WorkspaceMemberRow;
