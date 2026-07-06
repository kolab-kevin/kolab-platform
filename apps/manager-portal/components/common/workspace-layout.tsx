import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from '@kolab/ui';
import type { ReactNode } from 'react';

import {
  PORTAL_CARD_CLASS,
  PORTAL_CARD_HEADER_CLASS,
  PORTAL_CARD_TITLE_CLASS,
  PORTAL_SECTION_CLASS,
} from '@/lib/portal-ui';

type WorkspaceCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function WorkspaceCard({
  title,
  description,
  children,
  className,
  headerClassName,
}: WorkspaceCardProps) {
  return (
    <Card className={cn(PORTAL_CARD_CLASS, className)}>
      <CardHeader className={cn(PORTAL_CARD_HEADER_CLASS, headerClassName)}>
        <CardTitle className={PORTAL_CARD_TITLE_CLASS}>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type WorkspaceSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function WorkspaceSection({
  title,
  description,
  children,
  className,
}: WorkspaceSectionProps) {
  return (
    <section className={cn(PORTAL_SECTION_CLASS, className)}>
      {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      {children}
    </section>
  );
}
