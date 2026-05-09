import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { WorkerWebhookPayload } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('[webhook/worker] WEBHOOK_SECRET env var is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload: WorkerWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    jobId,
    status,
    glbUrl,
    glbPath,
    usdzUrl,
    usdzPath,
    errorMessage,
    processingTimeMs,
    fileSizeBytes,
    polygons,
    materialsCount,
    dimensionsMm,
    realDimensionsCm,
    enhancedImageUrls,
    enhancedImagePaths,
  } = payload;

  if (!jobId || !status) {
    return NextResponse.json(
      { error: 'jobId and status are required' },
      { status: 400 },
    );
  }

  if (status !== 'completed' && status !== 'failed') {
    return NextResponse.json(
      { error: 'status must be "completed" or "failed"' },
      { status: 400 },
    );
  }

  const { error: updateError } = status === 'completed'
    ? await supabaseAdmin
        .from('models_3d')
        .update({
          status,
          glb_url: glbUrl ?? null,
          glb_path: glbPath ?? null,
          usdz_url: usdzUrl ?? null,
          usdz_path: usdzPath ?? null,
          progress: 100,
          processing_time_ms: processingTimeMs ?? null,
          file_size_bytes: fileSizeBytes ?? null,
          polygons: polygons ?? null,
          materials_count: materialsCount ?? null,
          dimensions_mm: dimensionsMm ?? null,
          real_dimensions_cm: realDimensionsCm ?? null,
          enhanced_image_urls:  enhancedImageUrls  ?? null,
          enhanced_image_paths: enhancedImagePaths ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    : await supabaseAdmin
        .from('models_3d')
        .update({
          status,
          error_message: errorMessage ?? 'Processing failed',
          progress: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

  if (updateError) {
    console.error('[webhook/worker] DB update error:', updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
