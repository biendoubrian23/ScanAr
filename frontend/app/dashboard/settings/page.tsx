'use client';

import { useState, useEffect } from 'react';
import {
  User,
  CreditCard,
  Shield,
  Sparkles,
  Cloud,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Optimistic local state so the toggle responds immediately while the
  // Supabase update runs. Synced from `profile` whenever auth refreshes.
  const [gptEnhance, setGptEnhance] = useState(true);
  const [savingGpt,  setSavingGpt]  = useState(false);
  const [useTripo,   setUseTripo]   = useState(true);
  const [savingTripo, setSavingTripo] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile) {
      setGptEnhance(profile.gpt_enhance_enabled ?? true);
      setUseTripo(profile.use_tripo ?? true);
    }
  }, [profile]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', 'Profile updated');
    }
  };

  const handleToggleGptEnhance = async (next: boolean) => {
    if (!user) return;
    const previous = gptEnhance;
    setGptEnhance(next);              // optimistic
    setSavingGpt(true);

    const { error } = await supabase
      .from('users')
      .update({ gpt_enhance_enabled: next })
      .eq('id', user.id);

    setSavingGpt(false);

    if (error) {
      setGptEnhance(previous);        // rollback
      showToast('error', error.message);
    } else {
      await refreshProfile();
      showToast('success', next ? 'Amélioration IA activée' : 'Amélioration IA désactivée');
    }
  };

  const handleToggleTripo = async (next: boolean) => {
    if (!user) return;
    const previous = useTripo;
    setUseTripo(next);                 // optimistic
    setSavingTripo(true);

    const { error } = await supabase
      .from('users')
      .update({ use_tripo: next })
      .eq('id', user.id);

    setSavingTripo(false);

    if (error) {
      setUseTripo(previous);           // rollback
      showToast('error', error.message);
    } else {
      await refreshProfile();
      showToast('success', next ? 'Tripo3D (cloud) activé' : 'Modèle local activé');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showToast('error', 'Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  const PLANS = [
    {
      id: 'free',
      name: 'Free',
      price: '0',
      features: ['3 models/month', '720p textures', 'Community support'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '29',
      features: ['50 models/month', '4K textures', 'Priority support', 'Custom branding'],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      features: ['Unlimited models', '8K textures', 'Dedicated support', 'API access', 'SLA'],
    },
  ];

  return (
    <DashboardShell title="Settings">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-2xl shadow-black/40 backdrop-blur-xl border',
            toast.type === 'success'
              ? 'bg-green-500/15 border-green-500/30 text-green-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300',
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.text}
        </div>
      )}

      <div className="space-y-8 max-w-3xl">
        {/* Profile Section */}
        <section className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/30">
            <User className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
          </div>

          <div className="p-6 space-y-4">
            <Input
              label="Email"
              value={user?.email ?? ''}
              disabled
              helperText="Email cannot be changed"
            />

            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              disabled={authLoading}
            />

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveProfile}
                loading={saving}
                disabled={!fullName.trim() || fullName === profile?.full_name}
                size="sm"
              >
                Save changes
              </Button>
            </div>
          </div>
        </section>

        {/* AI Preferences Section */}
        <section className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/30">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-gray-900">Préférences IA</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* GPT enhancement toggle */}
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Améliorer mes images avec l&apos;IA
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Lorsque activé, GPT nettoie chaque photo (fond uni, isolation
                  de l&apos;objet) et génère les vues manquantes pour améliorer la
                  reconstruction 3D. Désactivez pour économiser sur les coûts
                  OpenAI — les photos originales seront envoyées telles quelles
                  au générateur 3D. <span className="text-gray-400">L&apos;estimation
                  automatique de la taille reste toujours active.</span>
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <Toggle
                  checked={gptEnhance}
                  onChange={handleToggleGptEnhance}
                  disabled={authLoading || savingGpt}
                  label="Améliorer mes images avec l'IA"
                />
              </div>
            </div>

            {/* Tripo3D vs local Hunyuan3D toggle */}
            <div className="flex items-start justify-between gap-6 pt-5 border-t border-white/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Cloud className="w-3.5 h-3.5 text-brand-500" />
                  <p className="text-sm font-medium text-gray-900">
                    Utiliser Tripo3D (cloud)
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Activé par défaut : la génération 3D passe par l&apos;API Tripo3D
                  cloud (plus rapide, qualité optimisée AR/mobile, ~60 crédits ≈
                  $0.60 par modèle). Désactivez pour utiliser le modèle Hunyuan3D
                  hébergé localement (gratuit mais lent, dépend de la machine
                  locale).
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                <Toggle
                  checked={useTripo}
                  onChange={handleToggleTripo}
                  disabled={authLoading || savingTripo}
                  label="Utiliser Tripo3D (cloud)"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/30">
            <Shield className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-gray-900">Security</h2>
          </div>

          <div className="p-6 space-y-4">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />

            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              helperText="At least 8 characters"
              autoComplete="new-password"
            />

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleChangePassword}
                loading={changingPassword}
                disabled={!newPassword || newPassword.length < 8}
                size="sm"
                variant="secondary"
              >
                Update password
              </Button>
            </div>
          </div>
        </section>

        {/* Plan Section */}
        <section className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/30">
            <CreditCard className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-gray-900">Plan & Billing</h2>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <p className="text-sm text-gray-500">
                Current plan:{' '}
                <span className="text-gray-900 font-semibold capitalize">
                  {profile?.plan ?? 'free'}
                </span>
              </p>
              <span className="text-xs text-gray-400">&middot;</span>
              <p className="text-sm text-gray-500">
                Credits:{' '}
                <span className="text-gray-900 font-semibold tabular-nums">
                  {profile?.credits ?? 0}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = profile?.plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'rounded-2xl p-5 border transition-all',
                      isCurrent
                        ? 'bg-brand-500/15 border-brand-400/30 shadow-[0_8px_32px_rgba(13,148,136,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]'
                        : 'bg-white/25 backdrop-blur-xl border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-white/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]',
                      plan.popular && !isCurrent && 'ring-1 ring-brand-500/20',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">{plan.name}</h3>
                      {plan.popular && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-brand-600/20 text-brand-300 border border-brand-500/30 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>

                    <p className="text-2xl font-bold text-gray-900 mb-4">
                      {plan.price === 'Custom' ? (
                        'Custom'
                      ) : (
                        <>
                          ${plan.price}
                          <span className="text-sm text-gray-500 font-normal">/mo</span>
                        </>
                      )}
                    </p>

                    <ul className="space-y-2 mb-5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="flex items-center justify-center h-9 rounded-full bg-brand-600/15 border border-brand-500/25 text-xs font-medium text-brand-600">
                        Current plan
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => showToast('success', 'Billing coming soon')}
                      >
                        {plan.price === 'Custom' ? 'Contact us' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
