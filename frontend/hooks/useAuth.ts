'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';

interface UseAuthReturn {
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Fetch user profile from the `users` table ──────────────────────────
  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useAuth] fetchProfile error:', error.message);
        setProfile(null);
      } else {
        setProfile(data as User);
      }
    },
    [supabase],
  );

  // ─── Bootstrap: get current session + subscribe to auth changes ─────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // ─── Sign In ─────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (error) return { error: error.message };

      router.push('/dashboard');
      return { error: null };
    },
    [supabase, router],
  );

  // ─── Sign Up ─────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
    ): Promise<{ error: string | null }> => {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      // If email confirmation is not required the user is immediately active.
      if (data.user && data.session) {
        // Upsert the public profile row.
        await supabase.from('users').upsert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          credits: 0,
          plan: 'free',
        });

        setLoading(false);
        router.push('/dashboard');
      } else {
        // Email confirmation required — let the UI display a message.
        setLoading(false);
      }

      return { error: null };
    },
    [supabase, router],
  );

  // ─── Sign Out ────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
  }, [supabase, router]);

  return { user, profile, loading, signIn, signUp, signOut };
}
