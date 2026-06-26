'use client';

import { BoardMember, BoardView, Team } from '@/shared/api/api';
import UserAvatar from '@/shared/ui/UserAvatar';
import {
  DeleteOutlined,
  FilterListOutlined,
  RestartAltOutlined,
  SaveOutlined,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { KeyboardEvent, useEffect, useMemo, useState } from 'react';
import {
  BoardFilters,
  BoardTaskPriority,
  BoardTaskSort,
  BoardTaskStatusFilter,
  areBoardFiltersActive,
} from './board-filters';

interface Props {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
  onReset: () => void;
  boardMembers?: BoardMember[];
  teams?: Team[];
  filteredCount: number;
  totalCount: number;
  isReorderDisabled: boolean;
  savedViews?: BoardView[];
  selectedViewId?: string | null;
  isSavingView?: boolean;
  isDeletingView?: boolean;
  onApplySavedView: (viewId: string | null) => void;
  onSaveView: (title: string) => void;
  onDeleteSavedView: (viewId: string) => void;
}

const PRIORITIES: Array<BoardTaskPriority> = [
  'low',
  'medium',
  'high',
  'urgent',
];

const PRIORITY_META: Record<BoardTaskPriority, { color: string }> = {
  low: { color: '#22c55e' },
  medium: { color: '#f59e0b' },
  high: { color: '#f97316' },
  urgent: { color: '#ef4444' },
};

const STATUSES: Array<BoardTaskStatusFilter> = [
  'open',
  'completed',
  'overdue',
  'noDueDate',
  'dueToday',
  'dueWeek',
];

const SORTS: Array<BoardTaskSort> = [
  'manual',
  'dueDate',
  'priority',
  'createdAt',
  'updatedAt',
  'assignee',
];

const normalizeLabelsInput = (value: string) =>
  value
    .split(',')
    .map((label) => label.trim().toLowerCase())
    .filter(Boolean);

const uniqueMembers = (members: BoardMember[] = []) =>
  [...members]
    .filter((member) => member.user?.id)
    .sort((a, b) => a.user.name.localeCompare(b.user.name));

const uniqueTeams = (teams: Team[] = []) =>
  [...teams].sort((a, b) => a.name.localeCompare(b.name));

const isPriority = (value: string): value is BoardTaskPriority =>
  value in PRIORITY_META;

const renderMemberOption = (member: BoardMember) => (
  <Box
    sx={{
      alignItems: 'center',
      display: 'flex',
      gap: 1,
      minWidth: 0,
    }}
  >
    <UserAvatar
      name={member.user.name}
      src={member.user.avatar}
      size={22}
    />
    <Typography
      variant="body2"
      sx={{
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {member.user.name}
    </Typography>
  </Box>
);

const renderTeamOption = (team: Team) => (
  <Box
    sx={{
      alignItems: 'center',
      display: 'flex',
      gap: 1,
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        bgcolor: team.color,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '50%',
        flexShrink: 0,
        height: 10,
        width: 10,
      }}
    />
    <Typography
      variant="body2"
      sx={{
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {team.name}
    </Typography>
  </Box>
);

const renderPriorityOption = (priority: BoardTaskPriority, label: string) => (
  <Box
    sx={{
      alignItems: 'center',
      display: 'flex',
      gap: 1,
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        bgcolor: PRIORITY_META[priority].color,
        borderRadius: '50%',
        flexShrink: 0,
        height: 10,
        width: 10,
      }}
    />
    <Typography
      variant="body2"
      sx={{
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Typography>
  </Box>
);

const BoardFiltersToolbar = ({
  filters,
  onChange,
  onReset,
  boardMembers,
  teams,
  filteredCount,
  totalCount,
  isReorderDisabled,
  savedViews = [],
  selectedViewId,
  isSavingView = false,
  isDeletingView = false,
  onApplySavedView,
  onSaveView,
  onDeleteSavedView,
}: Props) => {
  const t = useTranslations('BoardPage.filters');
  const taskCardT = useTranslations('TaskCard');
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [labelsInput, setLabelsInput] = useState(filters.labels.join(', '));
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewTitle, setViewTitle] = useState('');
  const isActive = areBoardFiltersActive(filters);
  const members = useMemo(() => uniqueMembers(boardMembers), [boardMembers]);
  const sortedTeams = useMemo(() => uniqueTeams(teams), [teams]);
  const selectedSavedViewId =
    savedViews.some((view) => view.id === selectedViewId)
      ? (selectedViewId ?? '')
      : '';
  const getStatusLabel = (status: BoardTaskStatusFilter) =>
    status === 'all' ? t('allStatuses') : t(`status.${status}`);
  const getAssigneeValue = (value: string) => {
    if (value === 'all') return t('allAssignees');
    if (value === 'me') return t('myTasks');
    if (value === 'unassigned') return t('unassigned');

    const member = members.find((item) => item.user.id === value);
    return member ? renderMemberOption(member) : t('unknownAssignee');
  };
  const getTeamValue = (value: string) => {
    if (value === 'all') return t('allTeams');
    if (value === 'my') return t('myTeams');

    const team = sortedTeams.find((item) => item.id === value);
    return team ? renderTeamOption(team) : t('unknownTeam');
  };
  const getPriorityValue = (value: string) =>
    isPriority(value)
      ? renderPriorityOption(value, taskCardT(`priority.${value}`))
      : t('allPriorities');

  useEffect(() => {
    setLabelsInput(filters.labels.join(', '));
  }, [filters.labels]);

  const patchFilters = (patch: Partial<BoardFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const applyLabelsInput = () => {
    patchFilters({ labels: normalizeLabelsInput(labelsInput) });
  };

  const handleLabelsKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyLabelsInput();
    }
  };

  const handleSaveView = () => {
    const title = viewTitle.trim();
    if (!title) return;
    onSaveView(title);
    setViewTitle('');
    setSaveDialogOpen(false);
  };

  const activeChips = [
    filters.search.trim()
      ? {
          key: 'search',
          label: t('chip.search', { value: filters.search.trim() }),
          onDelete: () => patchFilters({ search: '' }),
        }
      : null,
    filters.assignee !== 'all'
      ? {
          key: 'assignee',
          label:
            filters.assignee === 'me'
              ? t('chip.myTasks')
              : filters.assignee === 'unassigned'
                ? t('chip.unassigned')
                : t('chip.assignee', {
                    value:
                      members.find((member) => member.user.id === filters.assignee)
                        ?.user.name ?? t('unknownAssignee'),
                  }),
          onDelete: () => patchFilters({ assignee: 'all' }),
        }
      : null,
    filters.team !== 'all'
      ? {
          key: 'team',
          label:
            filters.team === 'my'
              ? t('chip.myTeams')
              : t('chip.team', {
                  value:
                    sortedTeams.find((team) => team.id === filters.team)?.name ??
                    t('unknownTeam'),
                }),
          onDelete: () => patchFilters({ team: 'all' }),
        }
      : null,
    filters.priority !== 'all'
      ? {
          key: 'priority',
          label: t('chip.priority', {
            value: taskCardT(`priority.${filters.priority}`),
          }),
          onDelete: () => patchFilters({ priority: 'all' }),
        }
      : null,
    filters.status !== 'all'
      ? {
          key: 'status',
          label: getStatusLabel(filters.status),
          onDelete: () => patchFilters({ status: 'all' }),
        }
      : null,
    filters.labels.length > 0
      ? {
          key: 'labels',
          label: t('chip.labels', { value: filters.labels.join(', ') }),
          onDelete: () => patchFilters({ labels: [] }),
        }
      : null,
    filters.sort !== 'manual'
      ? {
          key: 'sort',
          label: t('chip.sort', { value: t(`sort.${filters.sort}`) }),
          onDelete: () => patchFilters({ sort: 'manual' }),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    onDelete: () => void;
  }>;

  const form = (
    <Stack spacing={1.5}>
      <Box
        sx={{
          alignItems: { xs: 'stretch', md: 'center' },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          flexWrap: { md: 'wrap' },
          columnGap: 1,
          minWidth: 0,
          rowGap: { xs: 2, md: 3 },
          '& > *': {
            flexShrink: 0,
          },
        }}
      >
        <FormControl size="small" sx={{ minWidth: { md: 190 } }}>
          <InputLabel>{t('views.label')}</InputLabel>
          <Select
            label={t('views.label')}
            value={selectedSavedViewId}
            onChange={(event) =>
              onApplySavedView(event.target.value || null)
            }
          >
            <MenuItem value="">{t('views.none')}</MenuItem>
            {savedViews.map((view) => (
              <MenuItem key={view.id} value={view.id}>
                {view.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label={t('search')}
          value={filters.search}
          onChange={(event) => patchFilters({ search: event.target.value })}
          sx={{ minWidth: { md: 220 } }}
        />

        <FormControl size="small" sx={{ minWidth: { md: 170 } }}>
          <InputLabel>{t('assignee')}</InputLabel>
          <Select
            label={t('assignee')}
            value={filters.assignee}
            renderValue={(value) => getAssigneeValue(value)}
            onChange={(event) =>
              patchFilters({ assignee: event.target.value })
            }
          >
            <MenuItem value="all">{t('allAssignees')}</MenuItem>
            <MenuItem value="me">{t('myTasks')}</MenuItem>
            <MenuItem value="unassigned">{t('unassigned')}</MenuItem>
            {members.map((member) => (
              <MenuItem key={member.user.id} value={member.user.id}>
                {renderMemberOption(member)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { md: 170 } }}>
          <InputLabel>{t('team')}</InputLabel>
          <Select
            label={t('team')}
            value={filters.team}
            renderValue={(value) => getTeamValue(value)}
            onChange={(event) => patchFilters({ team: event.target.value })}
          >
            <MenuItem value="all">{t('allTeams')}</MenuItem>
            <MenuItem value="my">{t('myTeams')}</MenuItem>
            {sortedTeams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {renderTeamOption(team)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { md: 140 } }}>
          <InputLabel>{t('priority')}</InputLabel>
          <Select
            label={t('priority')}
            value={filters.priority}
            renderValue={(value) => getPriorityValue(value)}
            onChange={(event) =>
              patchFilters({
                priority: event.target.value as BoardFilters['priority'],
              })
            }
          >
            <MenuItem value="all">{t('allPriorities')}</MenuItem>
            {PRIORITIES.map((priority) => (
              <MenuItem key={priority} value={priority}>
                {renderPriorityOption(
                  priority,
                  taskCardT(`priority.${priority}`),
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { md: 150 } }}>
          <InputLabel>{t('statusLabel')}</InputLabel>
          <Select
            label={t('statusLabel')}
            value={filters.status}
            onChange={(event) =>
              patchFilters({
                status: event.target.value as BoardTaskStatusFilter,
              })
            }
          >
            <MenuItem value="all">{t('allStatuses')}</MenuItem>
            {STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {getStatusLabel(status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { md: 150 } }}>
          <InputLabel>{t('sortLabel')}</InputLabel>
          <Select
            label={t('sortLabel')}
            value={filters.sort}
            onChange={(event) =>
              patchFilters({ sort: event.target.value as BoardTaskSort })
            }
          >
            {SORTS.map((sort) => (
              <MenuItem key={sort} value={sort}>
                {t(`sort.${sort}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label={t('labels')}
          value={labelsInput}
          onChange={(event) => setLabelsInput(event.target.value)}
          onBlur={applyLabelsInput}
          onKeyDown={handleLabelsKeyDown}
          sx={{ minWidth: { md: 160 } }}
        />
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}
      >
        <Button
          size="small"
          variant={filters.assignee === 'me' ? 'contained' : 'outlined'}
          onClick={() =>
            patchFilters({
              assignee: filters.assignee === 'me' ? 'all' : 'me',
            })
          }
        >
          {t('myTasks')}
        </Button>
        <Button
          size="small"
          variant={filters.team === 'my' ? 'contained' : 'outlined'}
          onClick={() =>
            patchFilters({ team: filters.team === 'my' ? 'all' : 'my' })
          }
        >
          {t('myTeams')}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          {t('resultCount', { filtered: filteredCount, total: totalCount })}
        </Typography>
        {isActive && (
          <Button
            size="small"
            startIcon={<RestartAltOutlined />}
            onClick={onReset}
            sx={{ ml: { xs: 0, md: 'auto' } }}
          >
            {t('reset')}
          </Button>
        )}
        {isActive && (
          <Button
            size="small"
            startIcon={<SaveOutlined />}
            onClick={() => setSaveDialogOpen(true)}
            disabled={isSavingView}
          >
            {t('views.save')}
          </Button>
        )}
        {selectedSavedViewId && (
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={() => onDeleteSavedView(selectedSavedViewId)}
            disabled={isDeletingView}
          >
            {t('views.delete')}
          </Button>
        )}
      </Stack>
    </Stack>
  );

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
    >
      <Stack spacing={1.25}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', minWidth: 0 }}
          >
            <FilterListOutlined color="primary" fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t('title')}
            </Typography>
            <Chip
              size="small"
              label={t('resultCount', {
                filtered: filteredCount,
                total: totalCount,
              })}
              variant="outlined"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {isActive && (
              <IconButton
                size="small"
                onClick={onReset}
                aria-label={t('reset')}
                sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              >
                <RestartAltOutlined fontSize="small" />
              </IconButton>
            )}
            <Button
              size="small"
              variant={isActive ? 'contained' : 'outlined'}
              startIcon={<FilterListOutlined />}
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              {t('open')}
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>{form}</Box>

        {(activeChips.length > 0 || isReorderDisabled) && (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ flexWrap: 'wrap', rowGap: 0.75 }}
          >
            {activeChips.map((chip) => (
              <Chip
                key={chip.key}
                size="small"
                label={chip.label}
                onDelete={chip.onDelete}
              />
            ))}
            {isReorderDisabled && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={t('reorderDisabled')}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                }}
              />
            )}
          </Stack>
        )}
      </Stack>

      <Drawer
        anchor="bottom"
        open={isMobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              bgcolor: 'background.paper',
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('title')}
            </Typography>
            {isActive && (
              <Button size="small" onClick={onReset}>
                {t('reset')}
              </Button>
            )}
          </Stack>
          <Divider />
          {form}
          <Button
            variant="contained"
            onClick={() => {
              applyLabelsInput();
              setMobileDrawerOpen(false);
            }}
          >
            {t('apply')}
          </Button>
        </Stack>
      </Drawer>

      <Dialog
        open={isSaveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t('views.saveTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label={t('views.name')}
            value={viewTitle}
            onChange={(event) => setViewTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSaveView();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>
            {t('views.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveView}
            disabled={!viewTitle.trim() || isSavingView}
          >
            {t('views.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BoardFiltersToolbar;
