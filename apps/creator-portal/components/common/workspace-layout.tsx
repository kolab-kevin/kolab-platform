import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from '@kolab/ui';
import type { ReactNode } from 'react';

import {
  WORKSPACE_CARD_CLASS,
  WORKSPACE_CARD_HEADER_CLASS,
  WORKSPACE_CARD_TITLE_CLASS,
  WORKSPACE_SECTION_CLASS,
} from '@/lib/studio-ui';

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
    <Card className={cn(WORKSPACE_CARD_CLASS, className)}>
      <CardHeader className={cn(WORKSPACE_CARD_HEADER_CLASS, headerClassName)}>
        <CardTitle className={WORKSPACE_CARD_TITLE_CLASS}>{title}</CardTitle>
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
    <section className={cn(WORKSPACE_SECTION_CLASS, className)}>
      {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      {children}
    </section>
  );
}
