'use client';

import {
  Close as DialogClosePrimitive,
  Content as DialogContentPrimitive,
  Description as DialogDescriptionPrimitive,
  Overlay as DialogOverlayPrimitive,
  Portal as DialogPortalPrimitive,
  Root as DialogRoot,
  Title as DialogTitlePrimitive,
  Trigger as DialogTriggerPrimitive,
} from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { type ComponentProps, createContext, useContext, useMemo } from 'react';

import { useIsMobile } from '@/app/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import {
  DrawerClose as DrawerClosePrimitive,
  DrawerContent as DrawerContentPrimitive,
  DrawerOverlay as DrawerOverlayPrimitive,
  DrawerPortal as DrawerPortalPrimitive,
  Drawer as DrawerRootPrimitive,
  DrawerTrigger as DrawerTriggerPrimitive,
} from './drawer';

type DialogRootProps = ComponentProps<typeof DialogRoot>;

const DialogVariantContext = createContext<{ isMobile: boolean }>({
  isMobile: false,
});

function useDialogVariant() {
  return useContext(DialogVariantContext);
}

function Dialog({ children, ...props }: DialogRootProps) {
  const isMobile = useIsMobile();
  const contextValue = useMemo(() => ({ isMobile }), [isMobile]);

  return (
    <DialogVariantContext.Provider value={contextValue}>
      {isMobile ? (
        <DrawerRootPrimitive data-slot="dialog" direction="bottom" {...props}>
          {children}
        </DrawerRootPrimitive>
      ) : (
        <DialogRoot data-slot="dialog" {...props}>
          {children}
        </DialogRoot>
      )}
    </DialogVariantContext.Provider>
  );
}

function DialogTrigger({
  ...props
}: ComponentProps<typeof DialogTriggerPrimitive>) {
  const { isMobile } = useDialogVariant();

  return isMobile ? (
    <DrawerTriggerPrimitive data-slot="dialog-trigger" {...props} />
  ) : (
    <DialogTriggerPrimitive data-slot="dialog-trigger" {...props} />
  );
}

function DialogPortal({
  ...props
}: ComponentProps<typeof DialogPortalPrimitive>) {
  const { isMobile } = useDialogVariant();

  return isMobile ? (
    <DrawerPortalPrimitive data-slot="dialog-portal" {...props} />
  ) : (
    <DialogPortalPrimitive data-slot="dialog-portal" {...props} />
  );
}

function DialogClose({
  className,
  ...props
}: ComponentProps<typeof DialogClosePrimitive>) {
  const { isMobile } = useDialogVariant();
  const closeClassName = cn(
    'hover:cursor-pointer hover:bg-white/10',
    className
  );

  return isMobile ? (
    <DrawerClosePrimitive
      className={closeClassName}
      data-slot="dialog-close"
      {...props}
    />
  ) : (
    <DialogClosePrimitive
      className={closeClassName}
      data-slot="dialog-close"
      {...props}
    />
  );
}

function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogOverlayPrimitive>) {
  const { isMobile } = useDialogVariant();
  const overlayClassName = cn(
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in',
    className
  );

  return isMobile ? (
    <DrawerOverlayPrimitive
      className={overlayClassName}
      data-slot="dialog-overlay"
      {...props}
    />
  ) : (
    <DialogOverlayPrimitive
      className={overlayClassName}
      data-slot="dialog-overlay"
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: ComponentProps<typeof DialogContentPrimitive> & {
  showCloseButton?: boolean;
}) {
  const { isMobile } = useDialogVariant();
  const shouldShowClose = showCloseButton && !isMobile;
  const sanitizedClassName = useMemo(() => {
    if (!className) {
      return;
    }
    // On mobile, filter out selectors that target direct children as they break drawer structure
    const classes = className.split(' ').filter(Boolean);
    if (isMobile) {
      return classes
        .filter(
          (cls) => !(cls.startsWith('min-w-') || cls.startsWith('max-w-'))
        )
        .filter((cls) => !cls.includes('[&_>div:first-child]'))
        .filter((cls) => !cls.includes('[&_>div:nth-child'))
        .join(' ');
    }
    return classes
      .filter((cls) => !(cls.startsWith('min-w-') || cls.startsWith('max-w-')))
      .join(' ');
  }, [className, isMobile]);

  if (isMobile) {
    return (
      <DrawerPortalPrimitive data-slot="dialog-portal">
        <DialogOverlay />
        <DrawerContentPrimitive
          className={cn(
            'fixed z-50 flex h-auto flex-col border-none bg-transparent p-0 data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:bg-transparent data-[vaul-drawer-direction=bottom]:shadow-none data-[vaul-drawer-direction=bottom]:transition-none',
            sanitizedClassName
          )}
          data-slot="dialog-content"
          showHandle={false}
          {...props}
        >
          <div
            className="relative flex w-full flex-col overflow-hidden bg-white/8 backdrop-blur-xl"
            style={{
              borderRadius: '16px 16px 0 0',
              boxShadow:
                'inset 1px 1px 1px 0 rgba(255, 255, 255, 0.3), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.3)',
              maxHeight: '88dvh',
            }}
          >
            <div className="flex justify-center px-4 pt-4 pb-4">
              <div className="h-1.5 w-16 rounded-full bg-white/25" />
            </div>
            <div className="flex max-h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4 [-webkit-overflow-scrolling:touch]">
              {children}
            </div>
          </div>
        </DrawerContentPrimitive>
      </DrawerPortalPrimitive>
    );
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogContentPrimitive
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in',
          // Auto-fit content height, but cap at viewport height minus margins for scrolling
          // Use dvh (dynamic viewport height) for better mobile browser UI handling
          // When content exceeds max-height, the dialog will be constrained and inner content will scroll
          'h-auto max-h-[min(calc(100dvh-4rem),calc(100vh-4rem))] max-w-[calc(100%-2rem)] overflow-hidden',
          // Small screens and up: Maintain responsive width
          'sm:max-w-[calc(100%-10rem)]',
          // Medium screens: Standard dialog widths
          'md:max-w-lg',
          // Large screens: Allow larger dialogs but with reasonable limits
          'lg:max-w-2xl xl:max-w-4xl',
          // Override any conflicting classes from individual dialogs
          '[&.max-w-3xl]:max-w-[calc(100%-2rem)] sm:[&.max-w-3xl]:max-w-[calc(100%-2rem)] md:[&.max-w-3xl]:max-w-3xl [&.min-w-3xl]:min-w-0',
          '[&.max-w-4xl]:max-w-[calc(100%-2rem)] sm:[&.max-w-4xl]:max-w-[calc(100%-2rem)] md:[&.max-w-4xl]:max-w-4xl [&.min-w-4xl]:min-w-0',
          '[&.max-w-5xl]:max-w-[calc(100%-2rem)] sm:[&.max-w-5xl]:max-w-[calc(100%-2rem)] md:[&.max-w-5xl]:max-w-5xl [&.min-w-5xl]:min-w-0',
          className
        )}
        data-slot="dialog-content"
        {...props}
      >
        <div
          className="relative flex max-h-full min-h-0 flex-col overflow-hidden bg-white/8 backdrop-blur-xl"
          style={{
            borderRadius: '12px',
            boxShadow:
              'inset 1px 1px 1px 0 rgba(255, 255, 255, 0.3), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          <div className="flex max-h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 [-webkit-overflow-scrolling:touch] sm:p-6">
            {children}
          </div>
          {shouldShowClose && (
            <DialogClose className="absolute top-4 right-4 rounded-xs text-white opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0">
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          )}
        </div>
      </DialogContentPrimitive>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  const { isMobile } = useDialogVariant();

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        isMobile ? 'text-left' : 'text-center sm:text-left',
        className
      )}
      data-slot="dialog-header"
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      data-slot="dialog-footer"
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogTitlePrimitive>) {
  return (
    <DialogTitlePrimitive
      className={cn('font-semibold text-lg leading-none', className)}
      data-slot="dialog-title"
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogDescriptionPrimitive>) {
  return (
    <DialogDescriptionPrimitive
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
