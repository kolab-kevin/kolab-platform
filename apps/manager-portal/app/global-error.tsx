'use client';

import { Button } from '@kolab/ui';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {error.message || 'An unexpected error occurred in Manager Portal.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/portal/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
