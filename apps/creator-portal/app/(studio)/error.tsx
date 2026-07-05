'use client';

import { Button } from '@kolab/ui';
import Link from 'next/link';

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {error.message || 'Creator Studio encountered an unexpected error.'}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/studio/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
