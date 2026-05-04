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

  let body: { imageUrl?: string; imagePath?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body', success: false },
      { status: 400 },
    );
  }

  const { imageUrl, imagePath, name } = body;

  if (!imageUrl || !imagePath || !name) {
    return NextResponse.json(
      { data: null, error: 'imageUrl, imagePath and name are required', success: false },
      { status: 400 },
    );
  }

  // ── Create the models_3d record ──────────────────────────────────────────
  const { data: model, error: insertError } = await supabaseAdmin
    .from('models_3d')
    .insert({
      user_id: session.user.id,
      image_url: imageUrl,
      image_path: imagePath,
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
    image_url: imageUrl,
    image_path: imagePath,
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
