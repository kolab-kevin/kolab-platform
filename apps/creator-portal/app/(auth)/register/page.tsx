'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterForm, useAuth } from '@kolab/ui';
import { AuthApiError } from '@kolab/sdk';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <RegisterForm
        error={error}
        onSubmit={async (data) => {
          try {
            setError(null);
            await register(data.email, data.password);
            router.push('/dashboard');
          } catch (err) {
            setError(err instanceof AuthApiError ? err.message : 'Registration failed');
          }
        }}
      />
      <p className="mt-6 text-sm text-kolab-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-kolab-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
