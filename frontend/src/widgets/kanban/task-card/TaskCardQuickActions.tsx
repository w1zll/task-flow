'use client';

import type { Task } from '@/shared/api/api';
import UserAvatar from '@/shared/ui/UserAvatar';
import {
  CheckCircleOutlined,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { Box, Checkbox, Tooltip } from '@mui/material';
import { useTranslations } from 'next-intl';

interface TaskCardQuickActionsProps {
  task: Task;
  isDisabled: boolean;
  canEdit: boolean;
  onToggleCompletion: () => void;
}

const TaskCardQuickActions = ({
  task,
  isDisabled,
  canEdit,
  onToggleCompletion,
}: TaskCardQuickActionsProps) => {
  const t = useTranslations('TaskCard');

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 6,
        right: 6,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
    >
      <Tooltip title={task.isCompleted ? t('markIncomplete') : t('markComplete')}>
        <span>
          <Checkbox
            size="small"
            checked={!!task.isCompleted}
            disabled={isDisabled || !canEdit}
            onChange={onToggleCompletion}
            icon={<RadioButtonUnchecked fontSize="small" />}
            checkedIcon={<CheckCircleOutlined fontSize="small" />}
            slotProps={{
              input: {
                'aria-label': t('completionToggle'),
              },
            }}
            sx={{
              p: 0,
              width: 20,
              height: 20,
              color: 'text.disabled',
              '&.Mui-checked': {
                color: 'success.main',
              },
              '& .MuiSvgIcon-root': {
                fontSize: 20,
              },
            }}
          />
        </span>
      </Tooltip>
      {task.assigneeName && (
        <Tooltip title={task.assigneeName}>
          <Box>
            <UserAvatar
              name={task.assigneeName}
              src={task.assignee?.avatar}
              size={20}
            />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

export default TaskCardQuickActions;
