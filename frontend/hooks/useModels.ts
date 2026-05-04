'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Model3D } from '@/lib/types';

interface UseModelsReturn {
  models: Model3D[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useModels(): UseModelsReturn {
  const supabase = createClient();

  const [models, setModels] = useState<Model3D[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable ref to the current user id so the realtime filter
  // can access it inside the subscription callback without stale closures.
  const userIdRef = useRef<string | null>(null);

  // ─── Fetch all models for the current user ───────────────────────────────
  const fetchModels = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('models_3d')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setModels([]);
      } else {
        setModels((data as Model3D[]) ?? []);
      }

      setLoading(false);
    },
    [supabase],
  );

  // ─── Public refresh handler ──────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (userIdRef.current) {
      await fetchModels(userIdRef.current);
    }
  }, [fetchModels]);

  // ─── Bootstrap + Realtime subscription ──────────────────────────────────
  useEffect(() => {
    let channelName: string | null = null;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      userIdRef.current = userId;
      channelName = `models-${userId}`;

      // Initial data load
      await fetchModels(userId);

      // Realtime: listen for INSERT / UPDATE / DELETE on models_3d
      // filtered to the current user so only their own records stream in.
      supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'models_3d',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setModels((prev) => [payload.new as Model3D, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setModels((prev) =>
                prev.map((m) =>
                  m.id === (payload.new as Model3D).id
                    ? (payload.new as Model3D)
                    : m,
                ),
              );
            } else if (payload.eventType === 'DELETE') {
              setModels((prev) =>
                prev.filter((m) => m.id !== (payload.old as Model3D).id),
              );
            }
          },
        )
        .subscribe();
    };

    init();

    return () => {
      if (channelName) {
        supabase.channel(channelName).unsubscribe();
      }
    };
  }, [supabase, fetchModels]);

  return { models, loading, error, refresh };
}
