'use client';

import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { categorySortBy, categorySortDir, createPoolSorter } from '@/components/Explore/pool-utils';
import { ApeQueries, GemsTokenListQueryArgs, QueryData } from '@/components/Explore/queries';
import { ExploreTab, TokenListSortByField, normalizeSortByField } from '@/components/Explore/types';
import { TokenCardList } from '@/components/TokenCard/TokenCardList';
import { useExploreGemsTokenList } from '@/hooks/useExploreGemsTokenList';
import { EXPLORE_FIXED_TIMEFRAME, useExplore } from '@/contexts/ExploreProvider';
import { Pool } from '@/contexts/types';
import { isHoverableDevice, useBreakpoint } from '@/lib/device';
import { PausedIndicator } from './PausedIndicator';

const MOUSE_LEAVE_DELAY = 100; // ms delay before unpausing

type ExploreColumnProps = {
  tab: ExploreTab;
};

export const ExploreTabTitleMap: Record<ExploreTab, string> = {
  [ExploreTab.NEW]: `New`,
  [ExploreTab.GRADUATING]: `Soon`,
  [ExploreTab.GRADUATED]: `Bonded`,
};

export const ExploreColumn: React.FC<ExploreColumnProps> = ({ tab }) => {
  const { pausedTabs, setTabPaused, request } = useExplore();
  const isPaused = pausedTabs[tab];
  const setIsPaused = useCallback(
    (paused: boolean) => setTabPaused(tab, paused),
    [setTabPaused, tab]
  );

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-300px)]">
      {/* Desktop Column Header */}
      <div className="flex items-center justify-between p-3 max-lg:hidden">
        <div className="flex items-center gap-x-2">
          <h2 className="font-bold text-neutral-300">{ExploreTabTitleMap[tab]}</h2>
          {isPaused && <PausedIndicator />}
        </div>
      </div>

      {/* List */}
      <div className="relative flex-1 border-neutral-800 text-sm lg:border-t h-full">
        <TokenCardListContainer
          tab={tab}
          request={request}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
        />
      </div>
    </div>
  );
};

type TokenCardListContainerProps = {
  tab: ExploreTab;
  request: Required<GemsTokenListQueryArgs>;
  isPaused: boolean;
  setIsPaused: (isPaused: boolean) => void;
};

const timeframe = EXPLORE_FIXED_TIMEFRAME;

const TokenCardListContainer: React.FC<TokenCardListContainerProps> = memo(
  ({ tab, request, isPaused, setIsPaused }) => {
    const queryClient = useQueryClient();
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'md' || breakpoint === 'sm' || breakpoint === 'xs';

    const listRef = useRef<HTMLDivElement>(null);
    const mouseLeaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isMouseInsideRef = useRef(false);

    const { data: currentData, status } = useExploreGemsTokenList((data) => data[tab]);

    // Use ref to store snapshot to avoid re-renders
    const snapshotDataRef = useRef<Pool[] | undefined>(undefined);
    const [snapshotVersion, setSnapshotVersion] = useState(0);

    // Store current pools in a ref to avoid dependency issues
    const currentPoolsRef = useRef<Pool[] | undefined>(undefined);
    currentPoolsRef.current = currentData?.pools;

    const handleMouseEnter = useCallback(() => {
      if (!isHoverableDevice() || status !== 'success') {
        return;
      }

      // Clear any pending mouse leave timer
      if (mouseLeaveTimerRef.current) {
        clearTimeout(mouseLeaveTimerRef.current);
        mouseLeaveTimerRef.current = null;
      }

      isMouseInsideRef.current = true;

      // When clicking elements (copyable) it triggers mouse enter again
      // We don't want to re-snapshot data if already paused
      if (!isPaused) {
        snapshotDataRef.current = currentPoolsRef.current;
        setSnapshotVersion((v) => v + 1);
        setIsPaused(true);
      }
    }, [isPaused, setIsPaused, status]);

    const handleMouseLeave = useCallback(() => {
      if (!isHoverableDevice()) return;

      isMouseInsideRef.current = false;

      // Clear any existing timer
      if (mouseLeaveTimerRef.current) {
        clearTimeout(mouseLeaveTimerRef.current);
      }

      // Delay unpausing to prevent flickering when moving between elements
      mouseLeaveTimerRef.current = setTimeout(() => {
        // Only unpause if mouse is still outside
        if (!isMouseInsideRef.current) {
          setIsPaused(false);
        }
        mouseLeaveTimerRef.current = null;
      }, MOUSE_LEAVE_DELAY);
    }, [setIsPaused]);

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (mouseLeaveTimerRef.current) {
          clearTimeout(mouseLeaveTimerRef.current);
        }
      };
    }, []);

    // Mutate the args so stream sorts by timeframe
    useEffect(() => {
      queryClient.setQueriesData(
        {
          type: 'active',
          queryKey: ApeQueries.gemsTokenList(request).queryKey,
        },
        (prev?: QueryData<typeof ApeQueries.gemsTokenList>) => {
          const prevPools = prev?.[tab]?.pools;
          if (!prevPools) return;

          const pools = [...prevPools];

          // Re-sort
          const sortDir = categorySortDir(tab);
          let sortBy: TokenListSortByField | undefined;
          const defaultSortBy = categorySortBy(tab, timeframe);
          if (defaultSortBy) {
            sortBy = normalizeSortByField(defaultSortBy);
          }
          if (sortBy) {
            const sorter = createPoolSorter(
              {
                sortBy,
                sortDir,
              },
              timeframe
            );
            pools.sort(sorter);
          }

          return {
            ...prev,
            [tab]: {
              ...prev[tab],
              pools,
            },
            args: {
              ...prev?.args,
              timeframe,
            },
          };
        }
      );
    }, [queryClient, tab, request]);

    const handleScroll = useCallback(() => {
      if (!isMobile || !listRef.current) return;

      const top = listRef.current.getBoundingClientRect().top;

      if (top <= 0) {
        // Only snapshot on initial pause
        if (!isPaused) {
          snapshotDataRef.current = currentPoolsRef.current;
          setSnapshotVersion((v) => v + 1);
        }
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    }, [isPaused, setIsPaused, isMobile]);

    // Handle scroll pausing on mobile
    useEffect(() => {
      if (!isMobile) return;

      // Initial check
      handleScroll();

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        setIsPaused(false);
      };
    }, [isMobile, setIsPaused, handleScroll]);

    // Memoize displayData to prevent unnecessary re-renders
    const displayData = useMemo(() => {
      if (!isPaused) {
        return currentData?.pools;
      }
      
      const snapshotData = snapshotDataRef.current;
      if (!snapshotData) {
        return currentData?.pools;
      }
      
      // Get updated data for snapshot tokens
      const updatedSnapshot = snapshotData.map((snapshotPool) => {
        const current = currentData?.pools?.find(
          (p) => p.baseAsset.id === snapshotPool.baseAsset.id
        );
        return current ?? snapshotPool;
      });
      
      // Find new tokens that arrived during pause (not in snapshot)
      const snapshotIds = new Set(snapshotData.map((p) => p.baseAsset.id));
      const newTokens = currentData?.pools?.filter(
        (p) => !snapshotIds.has(p.baseAsset.id)
      ) ?? [];
      
      // Prepend new tokens to the list so they're visible
      return [...newTokens, ...updatedSnapshot];
    }, [isPaused, currentData?.pools, snapshotVersion]);

    return (
      <TokenCardList
        ref={listRef}
        data={displayData}
        status={status}
        timeframe={timeframe}
        trackPools
        className="lg:h-0 lg:min-h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    );
  }
);

TokenCardListContainer.displayName = 'TokenCardListContainer';
