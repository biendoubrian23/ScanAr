'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import type { Model3D, AllowedMimeType } from '@/lib/types';

const ALLOWED_TYPES: AllowedMimeType[] = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const STORAGE_BUCKET = 'images';

interface UseUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  upload: (file: File, modelName: string) => Promise<Model3D | null>;
}

export function useUpload(): UseUploadReturn {
  const supabase = createClient();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, modelName: string): Promise<Model3D | null> => {
      // ── Validation ──────────────────────────────────────────────────────
      if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
        const msg = 'Invalid file type. Please upload a JPG, PNG or WebP image.';
        setError(msg);
        return null;
      }

      if (file.size > MAX_SIZE_BYTES) {
        const msg = 'File is too large. Maximum size is 10 MB.';
        setError(msg);
        return null;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        // ── Get current user ───────────────────────────────────────────────
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          throw new Error('You must be signed in to upload images.');
        }

        const userId = session.user.id;

        // ── Build storage path ─────────────────────────────────────────────
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const fileName = `${uuidv4()}.${ext}`;
        const storagePath = `${userId}/${fileName}`;

        // ── Upload to Supabase Storage ─────────────────────────────────────
        // Supabase JS v2 does not emit upload progress events on the browser
        // client, so we advance to 50 % at this point to give user feedback.
        setProgress(20);

        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (storageError) {
          throw new Error(`Storage upload failed: ${storageError.message}`);
        }

        setProgress(60);

        // ── Build public URL ───────────────────────────────────────────────
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;

        // ── Create model record + enqueue processing job ───────────────────
        setProgress(80);

        const res = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            imagePath: storagePath,
            name: modelName.trim() || file.name,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `API error: ${res.status}`);
        }

        const { data: model } = (await res.json()) as { data: Model3D };

        setProgress(100);
        return model;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed.';
        setError(message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [supabase],
  );

  return { uploading, progress, error, upload };
}
