import { Button } from '@kolab/ui';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-destructive text-sm font-semibold uppercase tracking-[0.2em]">
          Unauthorized
        </p>
        <h1 className="mt-2 text-2xl font-bold">Access denied</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your account does not have permission to use Manager Portal. Contact your platform
          administrator if you believe this is an error.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
