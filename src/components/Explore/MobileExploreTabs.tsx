import React from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import { useExplore } from '@/contexts/ExploreProvider';
import { ExploreTab } from './types';
import { PausedIndicator } from './PausedIndicator';
import { cn } from '@/lib/utils';

export const ExploreTabTitleMap: Record<ExploreTab, string> = {
  [ExploreTab.NEW]: `New`,
  [ExploreTab.GRADUATING]: `Soon`,
  [ExploreTab.GRADUATED]: `Bonded`,
};

export const MobileExploreTabs = () => {
  const { mobileTab, setMobileTab, pausedTabs } = useExplore();
  return (
    <div className="sticky inset-x-0 top-0 z-20 border-b border-neutral-800 lg:hidden bg-neutral-950">
      <div className="px-3 py-2">
        <ToggleGroupPrimitive.Root
          className="flex h-9 w-full min-w-fit items-center gap-1 text-sm"
          type="single"
          value={mobileTab}
          onValueChange={(value) => {
            if (value) {
              setMobileTab(value as ExploreTab);
            }
          }}
        >
          <ToggleGroupItem value={ExploreTab.NEW}>
            {ExploreTabTitleMap[ExploreTab.NEW]}
            {mobileTab === ExploreTab.NEW && pausedTabs[ExploreTab.NEW] && <PausedIndicator />}
          </ToggleGroupItem>
          <ToggleGroupItem value={ExploreTab.GRADUATING}>
            {ExploreTabTitleMap[ExploreTab.GRADUATING]}
            {mobileTab === ExploreTab.GRADUATING && pausedTabs[ExploreTab.GRADUATING] && (
              <PausedIndicator />
            )}
          </ToggleGroupItem>
          <ToggleGroupItem value={ExploreTab.GRADUATED}>
            {ExploreTabTitleMap[ExploreTab.GRADUATED]}
            {mobileTab === ExploreTab.GRADUATED && pausedTabs[ExploreTab.GRADUATED] && (
              <PausedIndicator />
            )}
          </ToggleGroupItem>
        </ToggleGroupPrimitive.Root>
      </div>
    </div>
  );
};

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg px-4 py-2 text-neutral-400 transition-all font-medium',
        'data-[state=off]:hover:text-primary',
        'data-[state=on]:bg-primary/15 data-[state=on]:text-primary data-[state=on]:border data-[state=on]:border-primary/30',
        'disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
