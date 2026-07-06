'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_BOARD_LAYOUT,
  parseBoardLayoutFromSearchParams,
  writeBoardLayoutToSearchParams,
  type BoardLayout,
} from '../board-layout';

export const useBoardLayoutController = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const boardLayout = useMemo(
    () => parseBoardLayoutFromSearchParams(new URLSearchParams(searchParamsString)),
    [searchParamsString],
  );

  const replaceBoardLayoutUrl = useCallback(
    (layout: BoardLayout) => {
      const nextSearchParams = writeBoardLayoutToSearchParams(
        layout,
        new URLSearchParams(searchParamsString),
      );
      const nextQuery = nextSearchParams.toString();
      const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      if (nextQuery === searchParamsString) return;

      router.replace(nextPath, { scroll: false });
    },
    [pathname, router, searchParamsString],
  );

  return {
    boardLayout,
    defaultBoardLayout: DEFAULT_BOARD_LAYOUT,
    setBoardLayout: replaceBoardLayoutUrl,
  };
};
