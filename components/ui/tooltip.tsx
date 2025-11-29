'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type TooltipInteractionContextValue = {
  isTouch: boolean;
  open: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
};

const TooltipInteractionContext =
  React.createContext<TooltipInteractionContextValue | null>(null);

function useTooltipInteraction() {
  return React.useContext(TooltipInteractionContext);
}

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const { children, ...restProps } = props;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false
  );
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: coarse)');

    const updateIsTouch = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsTouch(event.matches);
    };

    updateIsTouch(mediaQuery);

    const listener = (event: MediaQueryListEvent) => updateIsTouch(event);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      return () => {
        mediaQuery.removeEventListener('change', listener);
      };
    }

    mediaQuery.addListener(listener);
    return () => {
      mediaQuery.removeListener(listener);
    };
  }, []);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const updateOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const setOpenManually = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const nextOpen =
        typeof value === 'function'
          ? (value as (previous: boolean) => boolean)(open ?? false)
          : value;

      updateOpen(nextOpen);
    },
    [open, updateOpen]
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (isTouch) {
        // On touch devices, we manage state manually via TooltipTrigger's onClick
        // Don't let Radix Tooltip control the state to avoid conflicts
        return;
      }

      updateOpen(nextOpen);
    },
    [isTouch, updateOpen]
  );

  const noopSetOpen = React.useCallback<
    TooltipInteractionContextValue['setOpen']
  >(() => {}, []);

  const contextValue = React.useMemo(
    () => ({
      isTouch,
      open: open ?? false,
      setOpen: isTouch ? setOpenManually : noopSetOpen,
    }),
    [isTouch, noopSetOpen, open, setOpenManually]
  );

  return (
    <TooltipProvider>
      <TooltipInteractionContext.Provider value={contextValue}>
        <TooltipPrimitive.Root
          data-slot="tooltip"
          {...restProps}
          defaultOpen={isTouch ? undefined : defaultOpen}
          onOpenChange={isTouch ? handleOpenChange : onOpenChange}
          open={isTouch ? open : openProp}
        >
          {children}
        </TooltipPrimitive.Root>
      </TooltipInteractionContext.Provider>
    </TooltipProvider>
  );
}

type TooltipTriggerProps = Omit<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>,
  'onClick'
> & {
  onClick?: React.MouseEventHandler<HTMLElement>;
};

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipTriggerProps
>(({ onClick, ...props }, ref) => {
  const interaction = useTooltipInteraction();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (interaction?.isTouch) {
        event.preventDefault();
        event.stopPropagation();
        interaction.setOpen((previous) => !previous);
      }

      onClick?.(event);
    },
    [interaction, onClick]
  );

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onClick={handleClick}
      ref={ref}
      {...props}
    />
  );
});

TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const interaction = useTooltipInteraction();

  if (interaction?.isTouch) {
    return (
      <Dialog onOpenChange={interaction.setOpen} open={interaction.open}>
        <DialogContent
          className={cn(
            'border px-4 py-4 text-muted-foreground text-sm',
            className
          )}
          data-slot="tooltip-dialog-content"
        >
          <div className="space-y-2 text-left">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          'fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 mx-2 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in text-balance rounded-md border bg-white px-3 py-1.5 text-primary-foreground text-xs data-[state=closed]:animate-out',
          className
        )}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        {...props}
      >
        {children}
        {/* <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-white fill-white" /> */}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
