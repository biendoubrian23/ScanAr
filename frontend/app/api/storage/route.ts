import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, StorageUsage } from '@/lib/types';

// ─── GET /api/storage ────────────────────────────────────────────────────────
// Returns the authenticated user's storage usage (used / limit / percent).
export async function GET(
  _req: NextRequest,
): Promise<NextResponse<ApiResponse<StorageUsage>>> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  const { data: usage, error: usageError } = await supabaseAdmin
    .from('user_storage_usage')
    .select('used_bytes, used_mb, storage_limit_mb')
    .eq('user_id', session.user.id)
    .single();

  if (usageError) {
    return NextResponse.json(
      { data: null, error: usageError.message, success: false },
      { status: 500 },
    );
  }

  const usedMb = Number(usage?.used_mb ?? 0);
  const limitMb = Number(usage?.storage_limit_mb ?? 500);
  const percent = limitMb > 0 ? Math.min(100, Math.round((usedMb / limitMb) * 100)) : 0;

  const data: StorageUsage = {
    used_bytes: Number(usage?.used_bytes ?? 0),
    used_mb: usedMb,
    limit_mb: limitMb,
    percent,
  };

  return NextResponse.json({ data, error: null, success: true });
}
