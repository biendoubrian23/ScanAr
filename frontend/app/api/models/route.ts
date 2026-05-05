import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Model3D, ProcessingJob } from '@/lib/types';

// ─── Redis client (lazily initialised, module-scoped) ────────────────────────
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

// ─── GET /api/models ─────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
): Promise<NextResponse<ApiResponse<Model3D[]>>> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('models_3d')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message, success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data as Model3D[], error: null, success: true });
}

// ─── POST /api/models ────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<Model3D>>> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  // Accept either:
  //   { imagePath: string, name: string }            ← legacy, single image
  //   { imagePaths: string[], name: string }          ← multi-view (1-4 images)
  let body: { imagePath?: string; imagePaths?: string[]; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 },
    );
  }

  const { imagePath, imagePaths, name } = body;

  // Normalise to an array of paths (1-4 elements)
  const paths: string[] = imagePaths && imagePaths.length > 0
    ? imagePaths
    : (imagePath ? [imagePath] : []);

  if (paths.length === 0 || !name) {
    return NextResponse.json(
      { data: null, error: 'At least one imagePath (or imagePaths) and name are required', success: false },
      { status: 400 },
    );
  }
  if (paths.length > 4) {
    return NextResponse.json(
      { data: null, error: 'Maximum 4 images allowed per model', success: false },
      { status: 400 },
    );
  }

  // Generate a long-lived signed URL for each image (worker has no auth, so
  // it must download via signed URL from the private 'images' bucket).
  const signedUrls: string[] = [];
  for (const p of paths) {
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('images')
      .createSignedUrl(p, 365 * 24 * 60 * 60); // 1 year
    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { data: null, error: `Failed to sign image URL for ${p}: ${signedError?.message ?? 'unknown'}`, success: false },
        { status: 500 },
      );
    }
    signedUrls.push(signedData.signedUrl);
  }

  const primaryUrl  = signedUrls[0];
  const primaryPath = paths[0];

  // ── Create the models_3d record ──────────────────────────────────────────
  // Legacy single-image columns mirror the first element so old code paths
  // (UI thumbnails, downstream consumers) continue to work without changes.
  const { data: model, error: insertError } = await supabaseAdmin
    .from('models_3d')
    .insert({
      user_id: session.user.id,
      image_url: primaryUrl,
      image_path: primaryPath,
      image_urls: signedUrls,
      image_paths: paths,
      name,
      status: 'pending',
      progress: 0,
    })
    .select()
    .single();

  if (insertError || !model) {
    return NextResponse.json(
      { data: null, error: insertError?.message ?? 'Failed to create model record', success: false },
      { status: 500 },
    );
  }

  // ── Push job to Redis queue ──────────────────────────────────────────────
  const job: ProcessingJob = {
    id: model.id,
    model_id: model.id,
    user_id: session.user.id,
    image_url: primaryUrl,
    image_path: primaryPath,
    image_urls: signedUrls,
    image_paths: paths,
    status: 'pending',
    created_at: model.created_at,
  };

  try {
    const r = getRedis();
    await r.rpush('scanar:jobs', JSON.stringify(job));
  } catch (redisErr) {
    console.error('[POST /api/models] Redis push failed:', redisErr);
    // Do NOT abort — the model record is saved. The worker can be
    // re-triggered manually or via a scheduled sweep.
  }

  return NextResponse.json(
    { data: model as Model3D, error: null, success: true },
    { status: 201 },
  );
}
