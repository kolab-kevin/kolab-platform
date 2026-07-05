import { Button } from '@kolab/ui';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.2em]">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This Creator Studio route does not exist or has moved.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/studio/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
