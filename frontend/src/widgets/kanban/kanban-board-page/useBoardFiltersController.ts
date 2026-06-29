import { useSnackbar } from 'notistack';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  useBoardViews,
  useCreateBoardView,
  useDeleteBoardView,
} from '@/shared/queries/boards.queries';
import {
  DEFAULT_BOARD_FILTERS,
  boardFiltersFromSavedView,
  boardFiltersToSavedView,
  parseBoardFiltersFromSearchParams,
  writeBoardFiltersToSearchParams,
  type BoardFilters,
} from '../board-filters';

export const useBoardFiltersController = (boardId: string) => {
  const t = useTranslations('BoardPage');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const { enqueueSnackbar } = useSnackbar();
  const boardViews = useBoardViews(boardId);
  const createBoardView = useCreateBoardView();
  const deleteBoardView = useDeleteBoardView();
  const selectedViewId = searchParams.get('view');
  const taskToHighlightId = searchParams.get('taskId');
  const boardFilters = useMemo(
    () =>
      parseBoardFiltersFromSearchParams(
        new URLSearchParams(searchParamsString),
      ),
    [searchParamsString],
  );

  const updateBoardFilters = useCallback(
    (filters: BoardFilters) => {
      const nextSearchParams = writeBoardFiltersToSearchParams(
        filters,
        new URLSearchParams(searchParamsString),
      );
      nextSearchParams.delete('view');
      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParamsString],
  );

  const resetBoardFilters = useCallback(() => {
    updateBoardFilters(DEFAULT_BOARD_FILTERS);
  }, [updateBoardFilters]);

  const applySavedView = useCallback(
    (viewId: string | null) => {
      if (!viewId) {
        updateBoardFilters(DEFAULT_BOARD_FILTERS);
        return;
      }

      const view = boardViews.data?.find((item) => item.id === viewId);
      if (!view) return;

      const filters = boardFiltersFromSavedView(view.filters, view.sort);
      const nextSearchParams = writeBoardFiltersToSearchParams(
        filters,
        new URLSearchParams(searchParamsString),
      );
      nextSearchParams.set('view', viewId);
      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [
      boardViews.data,
      pathname,
      router,
      searchParamsString,
      updateBoardFilters,
    ],
  );

  const saveCurrentView = useCallback(
    (title: string) => {
      const payload = boardFiltersToSavedView(boardFilters);
      createBoardView.mutate(
        {
          boardId,
          data: {
            title,
            filters: payload.filters,
            sort: payload.sort,
          },
        },
        {
          onSuccess: (view) => {
            enqueueSnackbar(t('filters.views.created'), {
              variant: 'success',
            });
            const nextSearchParams = writeBoardFiltersToSearchParams(
              boardFilters,
              new URLSearchParams(searchParamsString),
            );
            nextSearchParams.set('view', view.id);
            const nextQuery = nextSearchParams.toString();
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
              scroll: false,
            });
          },
          onError: () => {
            enqueueSnackbar(t('filters.views.createError'), {
              variant: 'error',
            });
          },
        },
      );
    },
    [
      boardFilters,
      boardId,
      createBoardView,
      enqueueSnackbar,
      pathname,
      router,
      searchParamsString,
      t,
    ],
  );

  const removeSavedView = useCallback(
    (viewId: string) => {
      deleteBoardView.mutate(
        { boardId, viewId },
        {
          onSuccess: () => {
            enqueueSnackbar(t('filters.views.deleted'), {
              variant: 'success',
            });
            if (selectedViewId === viewId) {
              updateBoardFilters(DEFAULT_BOARD_FILTERS);
            }
          },
          onError: () => {
            enqueueSnackbar(t('filters.views.deleteError'), {
              variant: 'error',
            });
          },
        },
      );
    },
    [
      boardId,
      deleteBoardView,
      enqueueSnackbar,
      selectedViewId,
      t,
      updateBoardFilters,
    ],
  );

  return {
    boardFilters,
    boardViews,
    selectedViewId,
    taskToHighlightId,
    createBoardView,
    deleteBoardView,
    updateBoardFilters,
    resetBoardFilters,
    applySavedView,
    saveCurrentView,
    removeSavedView,
  };
};
