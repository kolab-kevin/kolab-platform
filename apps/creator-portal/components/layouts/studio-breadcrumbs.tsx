'use client';

import Link from 'next/link';

import type { BreadcrumbItem } from '@/hooks/use-studio-navigation';

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
              {index > 0 ? <span aria-hidden>/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-foreground font-medium' : undefined}>
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
