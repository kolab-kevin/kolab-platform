'use client';

import { cn } from '@kolab/ui';
import * as React from 'react';

type ProductionDockLayoutProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  bottom: React.ReactNode;
};

const MIN_LEFT_WIDTH = 220;
const MIN_CENTER_WIDTH = 360;
const MIN_RIGHT_WIDTH = 260;

export function ProductionDockLayout({ left, center, right, bottom }: ProductionDockLayoutProps) {
  const [leftWidth, setLeftWidth] = React.useState(280);
  const [rightWidth, setRightWidth] = React.useState(320);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragTarget = React.useRef<'left' | 'right' | null>(null);

  React.useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!dragTarget.current || !containerRef.current) return;

      const bounds = containerRef.current.getBoundingClientRect();
      if (dragTarget.current === 'left') {
        const next = Math.max(MIN_LEFT_WIDTH, event.clientX - bounds.left);
        setLeftWidth(next);
      } else {
        const next = Math.max(MIN_RIGHT_WIDTH, bounds.right - event.clientX);
        setRightWidth(next);
      }
    }

    function handlePointerUp() {
      dragTarget.current = null;
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="space-y-4">
      <div
        className="hidden min-h-[560px] gap-0 xl:grid"
        style={{
          gridTemplateColumns: `${leftWidth}px 8px minmax(${MIN_CENTER_WIDTH}px, 1fr) 8px ${rightWidth}px`,
        }}
      >
        <div className="min-h-0 overflow-hidden">{left}</div>
        <button
          type="button"
          aria-label="Resize left dock panel"
          className={cn(
            'bg-border/40 hover:bg-primary/30 active:bg-primary/40 cursor-col-resize rounded-full transition-colors',
          )}
          onPointerDown={() => {
            dragTarget.current = 'left';
          }}
        />
        <div className="min-h-0 overflow-hidden">{center}</div>
        <button
          type="button"
          aria-label="Resize right dock panel"
          className={cn(
            'bg-border/40 hover:bg-primary/30 active:bg-primary/40 cursor-col-resize rounded-full transition-colors',
          )}
          onPointerDown={() => {
            dragTarget.current = 'right';
          }}
        />
        <div className="min-h-0 overflow-hidden">{right}</div>
      </div>

      <div className="grid gap-4 xl:hidden">
        {left}
        {center}
        {right}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{bottom}</div>
    </div>
  );
}
