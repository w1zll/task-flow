'use client';

import { Board } from '@/shared/api/api';
import { useBoards } from '@/shared/queries/boards.queries';
import {
  useSwitchWorkspace,
  useWorkspaces,
} from '@/shared/queries/workspaces.queries';
import { useAuthStore } from '@/shared/store/root.store';
import BoardCreateDialog from '@/widgets/boards/BoardCreateDialog';
import {
  Add,
  AssignmentTurnedInOutlined,
  Business,
  DashboardOutlined,
  GroupsOutlined,
  KeyboardArrowDown,
  Menu as MenuIcon,
  SettingsOutlined,
  ViewKanbanOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ReactNode, useEffect, useMemo, useState } from 'react';

const drawerWidth = 286;

interface Props {
  workspaceId: string;
  children: ReactNode;
}

const navItems = [
  {
    key: 'overview',
    icon: <DashboardOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}`,
  },
  {
    key: 'myTasks',
    icon: <AssignmentTurnedInOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}/my-tasks`,
  },
  {
    key: 'teams',
    icon: <GroupsOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}/teams`,
  },
  {
    key: 'boards',
    icon: <ViewKanbanOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}/boards`,
  },
  {
    key: 'settings',
    icon: <SettingsOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}/settings`,
  },
] as const;

type WorkspaceNavKey = (typeof navItems)[number]['key'];

const getActiveNavKey = (
  pathname: string,
  workspaceId: string,
): WorkspaceNavKey => {
  const base = `/workspaces/${workspaceId}`;
  if (pathname === base) return 'overview';
  if (pathname.startsWith(`${base}/my-tasks`)) return 'myTasks';
  if (pathname.startsWith(`${base}/teams`)) return 'teams';
  if (pathname.startsWith(`${base}/boards`)) return 'boards';
  if (pathname.startsWith(`${base}/settings`)) return 'settings';
  return 'overview';
};

const WorkspaceShell = ({ workspaceId, children }: Props) => {
  const t = useTranslations('WorkspaceShell');
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const setActiveWorkspace = useAuthStore(
    (state) => state.setActiveWorkspace,
  );
  const { data: workspaces = [] } = useWorkspaces();
  const { data: boards = [] } = useBoards();
  const {
    mutate: switchActiveWorkspace,
    isPending: isSwitchingWorkspace,
  } = useSwitchWorkspace();
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [workspaceMenuAnchor, setWorkspaceMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);

  const workspace = workspaces.find((item) => item.id === workspaceId);
  const workspaceBoards = useMemo(
    () =>
      boards
        .filter((board) => board.workspaceId === workspaceId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime(),
        ),
    [boards, workspaceId],
  );
  const activeNavKey = getActiveNavKey(pathname, workspaceId);
  const activeBoardId = pathname.match(
    new RegExp(`/workspaces/${workspaceId}/boards/([^/]+)`),
  )?.[1];
  const navLabels: Record<WorkspaceNavKey, string> = {
    overview: t('nav.overview'),
    myTasks: t('nav.myTasks'),
    teams: t('nav.teams'),
    boards: t('nav.boards'),
    settings: t('nav.settings'),
  };
  const boardRoleLabels = {
    owner: t('boardRole.owner'),
    editor: t('boardRole.editor'),
    viewer: t('boardRole.viewer'),
  };

  useEffect(() => {
    if (!workspace || workspace.isActive || isSwitchingWorkspace) return;

    switchActiveWorkspace(workspaceId, {
      onSuccess: (updatedWorkspace) =>
        setActiveWorkspace(updatedWorkspace.id),
    });
  }, [
    isSwitchingWorkspace,
    setActiveWorkspace,
    switchActiveWorkspace,
    workspace,
    workspaceId,
  ]);

  const closeMobile = () => setMobileOpen(false);

  const sidebar = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          color="inherit"
          endIcon={<KeyboardArrowDown />}
          onClick={(event) => setWorkspaceMenuAnchor(event.currentTarget)}
          sx={{
            justifyContent: 'space-between',
            textAlign: 'left',
            textTransform: 'none',
            border: '1px solid',
            borderColor: 'divider',
            px: 1.25,
            py: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', minWidth: 0 }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '6px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                flexShrink: 0,
              }}
            >
              <Business fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="span"
                variant="body2"
                sx={{ display: 'block', fontWeight: 700 }}
                noWrap
              >
                {workspace?.name ?? t('workspaceFallback')}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
                noWrap
              >
                {workspace
                  ? workspace.isPersonal
                    ? t('personal')
                    : t(`role.${workspace.currentUserRole}`)
                  : t('loading')}
              </Typography>
            </Box>
          </Stack>
        </Button>
      </Box>

      <Box sx={{ px: 1.25 }}>
        <List dense>
          {navItems.map((item) => {
            const href = item.href(workspaceId);
            const isActive = activeNavKey === item.key;

            return (
              <ListItemButton
                key={item.key}
                component={NextLink}
                href={href}
                selected={isActive}
                onClick={closeMobile}
                sx={{
                  borderRadius: '6px',
                  mb: 0.25,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={navLabels[item.key]} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Box
        sx={{
          px: 2,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ lineHeight: 1.2 }}
        >
          {t('boards')}
        </Typography>
        <Tooltip title={t('createBoard')}>
          <IconButton
            size="small"
            onClick={() => setCreateBoardOpen(true)}
            aria-label={t('createBoard')}
          >
            <Add fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ px: 1.25, pb: 1, overflowY: 'auto', flex: 1 }}>
        {workspaceBoards.length ? (
          <List dense disablePadding>
            {workspaceBoards.map((board: Board) => {
              const isActive = board.id === activeBoardId;

              return (
                <ListItemButton
                  key={board.id}
                  component={NextLink}
                  href={`/workspaces/${workspaceId}/boards/${board.id}`}
                  selected={isActive}
                  onClick={closeMobile}
                  sx={{
                    borderRadius: '6px',
                    mb: 0.25,
                    alignItems: 'flex-start',
                    '&.Mui-selected': {
                      bgcolor: alpha(board.color ?? '#669266', 0.14),
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: board.color ?? '#669266',
                      mt: 1,
                      mr: 1.25,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText
                    primary={board.title}
                    secondary={boardRoleLabels[board.currentUserRole]}
                    slotProps={{
                      primary: {
                        noWrap: true,
                        sx: { fontWeight: isActive ? 700 : 500 },
                      },
                      secondary: { noWrap: true },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 1, py: 1 }}
          >
            {t('emptyBoards')}
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 2, pt: 1 }}>
        <Chip
          size="small"
          label={t('boardsCount', { count: workspaceBoards.length })}
          sx={{ width: '100%' }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          height: {
            xs: 'calc(100dvh - 56px)',
            sm: 'calc(100dvh - 64px)',
          },
          minHeight: 0,
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              position: 'sticky',
              top: 0,
              width: drawerWidth,
              height: {
                xs: 'calc(100dvh - 56px)',
                sm: 'calc(100dvh - 64px)',
              },
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {sidebar}
        </Drawer>

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 9,
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label={t('openNavigation')}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {workspace?.name ?? t('workspaceFallback')}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {navLabels[activeNavKey]}
              </Typography>
            </Box>
          </Box>
          {children}
        </Box>
      </Box>

      <Drawer
        variant="temporary"
        open={isMobileOpen}
        onClose={closeMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: Math.min(drawerWidth, 320),
          },
        }}
      >
        {sidebar}
      </Drawer>

      <Menu
        anchorEl={workspaceMenuAnchor}
        open={Boolean(workspaceMenuAnchor)}
        onClose={() => setWorkspaceMenuAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 260 } } }}
      >
        {workspaces.map((item) => (
          <MenuItem
            key={item.id}
            selected={item.id === workspaceId}
            onClick={() => {
              setWorkspaceMenuAnchor(null);
              closeMobile();
              router.push(`/workspaces/${item.id}`);
            }}
          >
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {item.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.isPersonal
                  ? t('personal')
                  : t(`role.${item.currentUserRole}`)}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>

      <BoardCreateDialog
        open={createBoardOpen}
        onClose={() => setCreateBoardOpen(false)}
        workspaces={workspaces}
        defaultWorkspaceId={workspaceId}
        lockWorkspace
      />
    </>
  );
};

export default WorkspaceShell;
