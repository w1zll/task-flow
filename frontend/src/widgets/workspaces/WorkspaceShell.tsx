'use client';

import { useBoards } from '@/shared/queries/boards.queries';
import {
  useSwitchWorkspace,
  useWorkspaces,
} from '@/shared/queries/workspaces.queries';
import { useAuthStore } from '@/shared/store/root.store';
import BoardCreateDialog from '@/widgets/boards/BoardCreateDialog';
import { Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import DemoWorkspaceBanner from './DemoWorkspaceBanner';
import WorkspaceDesktopDrawer from './workspace-shell/WorkspaceDesktopDrawer';
import WorkspaceMenu from './workspace-shell/WorkspaceMenu';
import WorkspaceMobileDrawer from './workspace-shell/WorkspaceMobileDrawer';
import WorkspaceMobileHeader from './workspace-shell/WorkspaceMobileHeader';
import WorkspaceSidebar from './workspace-shell/WorkspaceSidebar';
import { getActiveNavKey } from './workspace-shell/navigation';

interface Props {
  workspaceId: string;
  children: ReactNode;
}

const WorkspaceShell = ({ workspaceId, children }: Props) => {
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
  const isDemoWorkspace = Boolean(
    workspace?.isDemoTemplate || workspace?.isDemoInstance,
  );
  const activeNavKey = getActiveNavKey(pathname, workspaceId);
  const activeBoardId = pathname.match(
    new RegExp(`/workspaces/${workspaceId}/boards/([^/]+)`),
  )?.[1];

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
  const closeWorkspaceMenu = () => setWorkspaceMenuAnchor(null);

  const selectWorkspace = (nextWorkspaceId: string) => {
    closeWorkspaceMenu();
    closeMobile();
    router.push(`/workspaces/${nextWorkspaceId}`);
  };

  const sidebarProps = {
    workspaceId,
    workspace,
    boards: workspaceBoards,
    activeNavKey,
    activeBoardId,
    onCloseNavigation: closeMobile,
    onOpenCreateBoard: () => setCreateBoardOpen(true),
    onOpenWorkspaceMenu: setWorkspaceMenuAnchor,
  };

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
        <WorkspaceDesktopDrawer>
          <WorkspaceSidebar {...sidebarProps} />
        </WorkspaceDesktopDrawer>

        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <WorkspaceMobileHeader
            workspace={workspace}
            activeNavKey={activeNavKey}
            onOpenNavigation={() => setMobileOpen(true)}
          />
          {workspace && isDemoWorkspace && (
            <DemoWorkspaceBanner />
          )}
          {children}
        </Box>
      </Box>

      <WorkspaceMobileDrawer open={isMobileOpen} onClose={closeMobile}>
        <WorkspaceSidebar {...sidebarProps} />
      </WorkspaceMobileDrawer>

      <WorkspaceMenu
        anchorEl={workspaceMenuAnchor}
        selectedWorkspaceId={workspaceId}
        workspaces={workspaces}
        onClose={closeWorkspaceMenu}
        onSelectWorkspace={selectWorkspace}
      />

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
