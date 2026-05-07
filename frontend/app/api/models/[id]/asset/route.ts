import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Bucket → content-type mapping
const ASSETS = {
  glb:  { bucket: 'models-glb',  contentType: 'model/gltf-binary'  },
  usdz: { bucket: 'models-usdz', contentType: 'model/vnd.usdz+zip' },
} as const;

type AssetKind = keyof typeof ASSETS;

// ── In-memory LRU cache ──────────────────────────────────────────────────────
// Same GLB downloaded by N visitors should hit Supabase once. Bounded by
// MAX_ENTRIES and TTL so memory pressure stays predictable on the worker.
interface CacheEntry { bytes: Uint8Array; contentType: string; ts: number }
const cache = new Map<string, CacheEntry>();
const MAX_ENTRIES = 30;          // ~150 MB worst-case at 5 MB/file
const TTL_MS      = 30 * 60_000; // 30 min

function getCached(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    cache.delete(key);
    return null;
  }
  // Refresh LRU position so hot entries stay alive
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function setCached(key: string, value: CacheEntry) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
}

// ── Route handler ────────────────────────────────────────────────────────────
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const typeParam = req.nextUrl.searchParams.get('type') as AssetKind | null;
  if (!typeParam || !(typeParam in ASSETS)) {
    return NextResponse.json({ error: 'type must be "glb" or "usdz"' }, { status: 400 });
  }
  const asset = ASSETS[typeParam];

  // Look up the storage path for this model + asset type. We only serve assets
  // for completed models; otherwise the file might not exist and we'd return
  // a corrupt body.
  const { data: model, error } = await supabaseAdmin
    .from('models_3d')
    .select('id, glb_path, usdz_path, status')
    .eq('id', id)
    .single();

  if (error || !model || model.status !== 'completed') {
    return NextResponse.json({ error: 'Model not found' }, { status: 404 });
  }

  const path: string | null = typeParam === 'glb' ? model.glb_path : model.usdz_path;
  if (!path) {
    return NextResponse.json({ error: `No ${typeParam} for this model` }, { status: 404 });
  }

  const cacheKey = `${asset.bucket}/${path}`;
  const cached = getCached(cacheKey);

  let bytes: Uint8Array;
  if (cached) {
    bytes = cached.bytes;
  } else {
    const { data: blob, error: dlError } = await supabaseAdmin.storage
      .from(asset.bucket)
      .download(path);

    if (dlError || !blob) {
      return NextResponse.json(
        { error: `Asset fetch failed: ${dlError?.message ?? 'unknown'}` },
        { status: 502 },
      );
    }

    const ab = await blob.arrayBuffer();
    bytes = new Uint8Array(ab);
    setCached(cacheKey, { bytes, contentType: asset.contentType, ts: Date.now() });
  }

  // BodyInit accepts ArrayBuffer / Blob / ReadableStream — wrap in a Blob to
  // keep TypeScript happy across Node versions.
  return new NextResponse(new Blob([new Uint8Array(bytes)], { type: asset.contentType }), {
    status: 200,
    headers: {
      'Content-Type':   asset.contentType,
      'Content-Length': String(bytes.length),
      // Browser cache for 1 day. Any CDN sitting in front (e.g., Cloudflare)
      // will respect s-maxage and stale-while-revalidate to serve subsequent
      // visitors without round-tripping to Supabase.
      'Cache-Control':  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      // Allow model-viewer to load it across origins (subdomain in Cloudflare tunnel)
      'Access-Control-Allow-Origin': '*',
    },
  });
}
