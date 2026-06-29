'use client';

import type { Board, Task, Team } from '@/shared/api/api';
import UserAvatar from '@/shared/ui/UserAvatar';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import type { PatchTaskField, TaskDraft } from './types';

interface TaskAssignmentFieldsProps {
  form: TaskDraft;
  board: Board;
  teams?: Team[];
  isTeamsLoading: boolean;
  canEdit: boolean;
  onPatch: PatchTaskField;
}

const TaskAssignmentFields = ({
  form,
  board,
  teams,
  isTeamsLoading,
  canEdit,
  onPatch,
}: TaskAssignmentFieldsProps) => {
  const t = useTranslations('TaskDetail');

  return (
    <>
      <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
        <InputLabel>{t('assignee')}</InputLabel>
        <Select
          label={t('assignee')}
          value={form.assigneeId ?? ''}
          disabled={!canEdit}
          onChange={(event) => {
            const selected = event.target.value as string;
            const member = board.members?.find((item) => item.userId === selected);
            onPatch('assigneeId', selected as Task['assigneeId']);
            onPatch('assigneeName', member?.user?.name ?? '');
          }}
          renderValue={(value) => {
            const member = board.members?.find((item) => item.userId === value);
            return member ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserAvatar
                  name={member.user.name}
                  src={member.user.avatar}
                  size={24}
                />
                <span>{member.user.name}</span>
              </Box>
            ) : (
              t('unassigned')
            );
          }}
        >
          <MenuItem value="">{t('unassigned')}</MenuItem>
          {board.members?.map((member) => (
            <MenuItem key={member.id} value={member.userId}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserAvatar
                  name={member.user.name}
                  src={member.user.avatar}
                  size={24}
                />
                <span>{member.user.name}</span>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
        <InputLabel>{t('team')}</InputLabel>
        <Select
          label={t('team')}
          value={form.teamId ?? ''}
          disabled={!canEdit || isTeamsLoading}
          onChange={(event) =>
            onPatch('teamId', (event.target.value || null) as Task['teamId'])
          }
          renderValue={(value) => {
            const team = teams?.find((item) => item.id === value);
            return team ? (
              <Chip
                size="small"
                label={team.name}
                sx={{
                  bgcolor: team.color,
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            ) : (
              t('noTeam')
            );
          }}
        >
          <MenuItem value="">{t('noTeam')}</MenuItem>
          {teams?.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: team.color,
                  mr: 1,
                }}
              />
              {team.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default TaskAssignmentFields;
