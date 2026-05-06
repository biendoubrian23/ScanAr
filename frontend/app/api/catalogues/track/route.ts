import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getDeviceType } from '@/lib/utils';

const VALID_EVENTS = ['catalogue_view', 'item_view', 'item_ar_open', 'social_click'] as const;
type CatalogueEvent = typeof VALID_EVENTS[number];

interface TrackBody {
  slug:        string;
  event_type:  CatalogueEvent;
  item_id?:    string | null;
  metadata?:   Record<string, unknown>;
}

// ─── POST /api/catalogues/track ──────────────────────────────────────────────
// Public, fire-and-forget. Records a single event for a catalogue page.
// The DB trigger bumps view counters on the catalogue / item.
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: TrackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { slug, event_type, item_id, metadata } = body;

  if (typeof slug !== 'string' || !slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }
  if (!VALID_EVENTS.includes(event_type)) {
    return NextResponse.json({ error: 'invalid event_type' }, { status: 400 });
  }
  if ((event_type === 'item_view' || event_type === 'item_ar_open') && !item_id) {
    return NextResponse.json({ error: 'item_id is required for item events' }, { status: 400 });
  }

  // Look up the catalogue by slug, ensuring it's publicly accessible
  const { data: cat, error: lookupError } = await supabaseAdmin
    .from('catalogues')
    .select('id, is_active, is_public')
    .eq('slug', slug)
    .single();

  if (lookupError || !cat) {
    return NextResponse.json({ error: 'catalogue not found' }, { status: 404 });
  }
  if (!cat.is_active || !cat.is_public) {
    return NextResponse.json({ error: 'catalogue not accessible' }, { status: 403 });
  }

  // Optional: if item_id is provided, validate it belongs to this catalogue
  if (item_id) {
    const { data: it } = await supabaseAdmin
      .from('catalogue_items')
      .select('id')
      .eq('id', item_id)
      .eq('catalogue_id', cat.id)
      .maybeSingle();
    if (!it) {
      return NextResponse.json({ error: 'item not in catalogue' }, { status: 400 });
    }
  }

  const userAgent  = req.headers.get('user-agent') ?? '';
  const deviceType = getDeviceType(userAgent);

  const { error: insertError } = await supabaseAdmin.from('catalogue_events').insert({
    catalogue_id: cat.id,
    item_id:      item_id ?? null,
    event_type,
    device_type:  deviceType,
    user_agent:   userAgent || null,
    metadata:     metadata && typeof metadata === 'object' ? metadata : {},
  });

  if (insertError) {
    console.error('[POST /api/catalogues/track] insert error:', insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
