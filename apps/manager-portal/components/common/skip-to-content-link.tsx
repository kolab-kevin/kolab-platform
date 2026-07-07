import { cn } from '@kolab/ui';

import { PORTAL_FOCUS_RING_CLASS } from '@/lib/portal-ui';

export function SkipToContentLink() {
  return (
    <a
      href="#portal-main-content"
      className={cn(
        'bg-primary text-primary-foreground sr-only fixed left-4 top-4 z-[100] rounded-md px-4 py-2 text-sm font-medium',
        'focus:not-sr-only',
        PORTAL_FOCUS_RING_CLASS,
      )}
    >
      Skip to main content
    </a>
  );
}
