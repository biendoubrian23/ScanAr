'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Scan, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ─── Signup Page ──────────────────────────────────────────────────────────────

export default function SignupPage() {
  const { signUp, loading } = useAuth();

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim());

    if (signUpError) {
      setError(signUpError);
    } else {
      // If no redirect happened (email confirmation required) show a message
      setSuccess(true);
    }
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
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Start turning images into AR experiences
            </p>
          </div>

          {success ? (
            <div
              role="status"
              className={cn(
                'flex flex-col items-center gap-4 py-6 text-center',
              )}
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30">
                <CheckCircle2 className="w-7 h-7 text-green-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-zinc-100 font-semibold">Check your email</p>
                <p className="mt-1 text-sm text-zinc-500">
                  We&apos;ve sent a confirmation link to{' '}
                  <span className="text-zinc-300">{email}</span>
                </p>
              </div>
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Full name"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                disabled={loading}
              />

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
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                helperText="At least 8 characters"
                disabled={loading}
              />

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
                Create account
              </Button>
            </form>
          )}

          {/* Sign-in link */}
          {!success && (
            <p className="mt-6 text-center text-sm text-zinc-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-zinc-700">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
