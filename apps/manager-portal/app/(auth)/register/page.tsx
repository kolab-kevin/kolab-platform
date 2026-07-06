'use client';

import { RegisterForm, useAuth } from '@kolab/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/portal/dashboard');
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-6 text-center">
        <p className="text-primary text-xs font-semibold uppercase tracking-[0.24em]">Kōlab</p>
        <h1 className="text-2xl font-bold">Create account</h1>
      </div>
      <RegisterForm
        error={error}
        onSubmit={async (data) => {
          try {
            setError(null);
            await register(data.email, data.password);
            router.push('/portal/dashboard');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
          }
        }}
      />
      <p className="text-muted-foreground mt-6 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
