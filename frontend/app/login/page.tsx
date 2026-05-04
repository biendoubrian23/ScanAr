'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Lock, Scan, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { signIn, loading } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) setError(signInError);
  };

  return (
    <div
      className={cn(
        'min-h-screen w-full flex items-center justify-center',
        'bg-dark-950',
        'px-4 py-12',
      )}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className={cn(
              'flex items-center justify-center w-14 h-14 rounded-2xl mb-4',
              'bg-gradient-to-br from-brand-600 to-brand-500',
              'shadow-lg shadow-brand-600/40',
            )}
          >
            <Scan className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <span className="text-2xl font-bold gradient-text tracking-tight">
            ScanAR
          </span>
        </div>

        {/* Card */}
        <div
          className={cn(
            'glass-dark rounded-3xl',
            'px-8 py-8',
            'shadow-2xl shadow-black/40',
          )}
        >
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-zinc-100 leading-tight">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Sign in to your ScanAR account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              disabled={loading}
            />

            {/* Forgot password */}
            <div className="flex justify-end">
              <span
                className="text-xs text-zinc-600 cursor-not-allowed select-none"
                title="Coming soon"
              >
                Forgot password?
              </span>
            </div>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className={cn(
                  'flex items-start gap-2.5 rounded-xl px-4 py-3',
                  'bg-red-500/10 border border-red-500/25 text-red-400 text-sm',
                )}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>

          {/* Sign-up link */}
          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-zinc-700">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
