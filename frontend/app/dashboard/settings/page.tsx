'use client';

import { useState, useEffect } from 'react';
import {
  User,
  CreditCard,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
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
        <section className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/6">
            <User className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Profile</h2>
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

        {/* Security Section */}
        <section className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/6">
            <Shield className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Security</h2>
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
        <section className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/6">
            <CreditCard className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Plan & Billing</h2>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <p className="text-sm text-zinc-400">
                Current plan:{' '}
                <span className="text-zinc-100 font-semibold capitalize">
                  {profile?.plan ?? 'free'}
                </span>
              </p>
              <span className="text-xs text-zinc-600">&middot;</span>
              <p className="text-sm text-zinc-400">
                Credits:{' '}
                <span className="text-zinc-100 font-semibold tabular-nums">
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
                      'rounded-xl p-5 border transition-colors',
                      isCurrent
                        ? 'bg-brand-600/10 border-brand-500/30'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20',
                      plan.popular && !isCurrent && 'ring-1 ring-brand-500/20',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-zinc-200">{plan.name}</h3>
                      {plan.popular && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-brand-600/20 text-brand-300 border border-brand-500/30 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>

                    <p className="text-2xl font-bold text-zinc-100 mb-4">
                      {plan.price === 'Custom' ? (
                        'Custom'
                      ) : (
                        <>
                          ${plan.price}
                          <span className="text-sm text-zinc-500 font-normal">/mo</span>
                        </>
                      )}
                    </p>

                    <ul className="space-y-2 mb-5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="flex items-center justify-center h-9 rounded-lg bg-brand-600/15 border border-brand-500/25 text-xs font-medium text-brand-300">
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
