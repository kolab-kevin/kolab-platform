'use client';

import Link from 'next/link';

import type { BreadcrumbItem } from '@/hooks/use-studio-navigation';
import { WORKSPACE_FOCUS_RING_CLASS } from '@/lib/studio-ui';

type StudioBreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function StudioBreadcrumbs({ items }: StudioBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="text-muted-foreground/70">
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`hover:text-foreground transition-colors ${WORKSPACE_FOCUS_RING_CLASS}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'text-foreground font-medium' : undefined}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
