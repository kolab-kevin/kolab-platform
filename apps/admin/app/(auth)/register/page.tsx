'use client';

import { AuthApiError } from '@kolab/sdk';
import { RegisterForm, useAuth } from '@kolab/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
      <p className="text-kolab-muted mt-6 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-kolab-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
