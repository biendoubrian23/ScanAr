'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Scan,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';

const CANAPE_SRC = '/images/login/canap%C3%A9.png';
const FOOD_SRC   = '/images/login/food.png';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
      <path fill="#34A853" d="M3.9 7.4l3.2 2.4C8 8 9.9 6.9 12 6.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 8.2 2.5 4.9 4.5 3.9 7.4z" />
      <path fill="#FBBC05" d="M12 21.5c2.6 0 4.7-.8 6.3-2.3l-3-2.5c-.8.6-2 1.1-3.3 1.1-2.6 0-4.8-1.7-5.5-4.1L3.3 16c1.6 3.3 4.9 5.5 8.7 5.5z" />
      <path fill="#4285F4" d="M21 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.2 1.1-1 2.3-2.2 3l3 2.5c1.8-1.7 2.7-4.2 2.7-7.8z" />
    </svg>
  );
}

export default function LoginPage() {
  const { signIn, loading } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Veuillez saisir votre email et votre mot de passe.');
      return;
    }

    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) setError(signInError);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f3f4f5]">
      <Navbar />
      <main className="flex w-full flex-1 items-center justify-center p-4 sm:p-6">
        <div
        className={cn(
          'grid w-full max-w-[1080px] grid-cols-1 lg:grid-cols-2',
          'overflow-hidden rounded-3xl bg-white',
          'shadow-[0_30px_80px_-30px_rgba(15,23,42,0.18)] ring-1 ring-gray-200/70',
          'min-h-[640px]',
        )}
      >
        {/* ── Left visual panel ──────────────────────────────────────────── */}
        <aside className="relative hidden flex-col overflow-hidden bg-[#f6f9f9] p-10 lg:flex">
          {/* Soft brand halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-80px] top-[18%] h-72 w-72 rounded-full bg-brand-200/50 blur-3xl"
          />

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 shadow-[0_6px_18px_-6px_rgba(20,184,166,0.6)]">
              <Scan className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-brand-500">
              ScanAR
            </span>
          </div>

          {/* Heading */}
          <div className="relative z-10 mt-12">
            <h2 className="text-[40px] font-bold leading-[1.05] tracking-tight text-gray-900">
              Vendez <span className="text-brand-500">plus</span>.
            </h2>
            <p className="mt-3 text-[15px] text-gray-500">
              Vos visiteurs vous attendent. Reprenez là où vous en étiez.
            </p>
          </div>

          {/* Decorative stack: canapé over food platter */}
          <div className="relative z-10 mt-auto flex flex-col items-center pt-8">
            <motion.img
              src={CANAPE_SRC}
              alt=""
              aria-hidden="true"
              draggable={false}
              initial={{ opacity: 0, y: -28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none w-[95%] max-w-[440px] select-none drop-shadow-[0_24px_30px_rgba(15,23,42,0.18)]"
            />
            <motion.img
              src={FOOD_SRC}
              alt=""
              aria-hidden="true"
              draggable={false}
              initial={{ opacity: 0, y: 36, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.05, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none mt-2 w-[80%] max-w-[360px] select-none drop-shadow-[0_30px_40px_rgba(15,23,42,0.22)]"
            />
          </div>
        </aside>

        {/* ── Right form panel ───────────────────────────────────────────── */}
        <section className="flex items-center justify-center bg-white p-6 sm:p-10">
          <div className="w-full max-w-[360px]">
            {/* Mobile-only brand */}
            <div className="mb-7 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 shadow-[0_6px_18px_-6px_rgba(20,184,166,0.6)]">
                <Scan className="h-5 w-5 text-white" strokeWidth={2.25} />
              </div>
              <span className="text-xl font-semibold tracking-tight text-brand-500">
                ScanAR
              </span>
            </div>

            <h1 className="text-center text-[22px] font-bold tracking-tight text-gray-900">
              Connexion
            </h1>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
              {/* Email */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className={cn(
                      'h-11 w-full rounded-xl pl-10 pr-3.5 text-[14px] text-gray-900 placeholder:text-gray-400',
                      'border border-gray-200 bg-white',
                      'transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10',
                      'disabled:cursor-not-allowed disabled:bg-gray-50',
                    )}
                  />
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mot de passe
                </span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className={cn(
                      'h-11 w-full rounded-xl pl-10 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400',
                      'border border-gray-200 bg-white',
                      'transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10',
                      'disabled:cursor-not-allowed disabled:bg-gray-50',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {/* Forgot password */}
              <div className="text-right">
                <span
                  className="cursor-not-allowed select-none text-xs font-medium text-brand-500"
                  title="Bientôt disponible"
                >
                  Mot de passe oublié ?
                </span>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white',
                  'bg-brand-500 hover:bg-brand-600 active:bg-brand-700',
                  'shadow-[0_8px_22px_-8px_rgba(20,184,166,0.6)]',
                  'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Se connecter
                {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              <span>ou</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Google (placeholder, not wired) */}
            <button
              type="button"
              disabled
              title="Bientôt disponible"
              className={cn(
                'flex h-11 w-full items-center justify-center gap-2.5 rounded-xl text-[14px] font-medium text-gray-700',
                'border border-gray-200 bg-white',
                'cursor-not-allowed opacity-90 transition-colors hover:bg-gray-50',
              )}
            >
              <GoogleIcon className="h-4 w-4" />
              Continuer avec Google
            </button>

            {/* Sign-up link */}
            <p className="mt-5 text-center text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link
                href="/signup"
                className="font-medium text-brand-500 transition-colors hover:text-brand-600"
              >
                Créer un compte
              </Link>
            </p>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-gray-400">
              En vous connectant, vous acceptez nos{' '}
              <span className="text-brand-500">Conditions d&apos;utilisation</span> et notre{' '}
              <span className="text-brand-500">Politique de confidentialité</span>.
            </p>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}
