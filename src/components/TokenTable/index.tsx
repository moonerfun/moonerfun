import { useInfiniteQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { memo } from 'react';

import { BottomPanelTab, bottomPanelTabAtom } from './config';
import { useTokenInfo } from '@/hooks/queries';
import { ReadableNumber } from '../ui/ReadableNumber';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { cn } from '@/lib/utils';
import { TxnsTab } from './TxnsTab';
import { HoldersTab } from './HoldersTab';

type TokenBottomPanelProps = {
  className?: string;
};

export const TokenBottomPanel: React.FC<TokenBottomPanelProps> = memo(({ className }) => {
  const [tab, setTab] = useAtom(bottomPanelTabAtom);

  return (
    <Tabs
      className={cn('flex flex-col h-full', className)}
      value={tab}
      onValueChange={(value) => setTab(value as BottomPanelTab)}
    >
      <div className="flex items-center justify-between border-b border-neutral-800 px-2 shrink-0">
        <TabsList className="scrollbar-none flex h-10 items-center text-sm gap-1">
          <TabsTrigger value={BottomPanelTab.TXNS}>
            <span className="sm:hidden">{`Txns`}</span>
            <span className="max-sm:hidden">{`Transactions`}</span>
          </TabsTrigger>

          <TabsTrigger value={BottomPanelTab.HOLDERS}>
            <span>{`Holders`}</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent className="flex-1 min-h-0 overflow-hidden" value={BottomPanelTab.TXNS}>
        <TxnsTab />
      </TabsContent>

      <TabsContent className="flex-1 min-h-0 overflow-hidden" value={BottomPanelTab.HOLDERS}>
        <HoldersTab />
      </TabsContent>
    </Tabs>
  );
});

TokenBottomPanel.displayName = 'TokenBottomPanel';
