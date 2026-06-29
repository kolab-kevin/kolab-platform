'use client';

import { AuthApiError } from '@kolab/sdk';
import { LoginForm, useAuth } from '@kolab/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <LoginForm
        error={error}
        onSubmit={async (data) => {
          try {
            setError(null);
            await login(data.email, data.password);
            router.push('/dashboard');
          } catch (err) {
            setError(err instanceof AuthApiError ? err.message : 'Login failed');
          }
        }}
      />
      <p className="text-kolab-muted mt-6 text-sm">
        No account?{' '}
        <Link href="/register" className="text-kolab-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
