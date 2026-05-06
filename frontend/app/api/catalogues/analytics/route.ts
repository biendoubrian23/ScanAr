import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Model3D } from '@/lib/types';

export interface CatalogueAnalyticsTopCat {
  id:         string;
  slug:       string;
  title:      string;
  view_count: number;
}

export interface CatalogueAnalyticsTopItem {
  id:             string;
  catalogue_id:   string;
  catalogue_slug: string;
  label:          string;
  image_url:      string | null;
  ar_open_count:  number;
}

export interface CatalogueAnalyticsSummary {
  total_catalogue_views: number;
  total_ar_opens:        number;
  total_social_clicks:   number;
  active_catalogues:     number;
  device_breakdown:      { ios: number; android: number; desktop: number; unknown: number };
  social_breakdown:      Record<string, number>;
  daily_buckets:         { date: string; count: number }[];
  top_catalogues:        CatalogueAnalyticsTopCat[];
  top_items:             CatalogueAnalyticsTopItem[];
  range_days:            number;
}

// ─── GET /api/catalogues/analytics ───────────────────────────────────────────
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<CatalogueAnalyticsSummary>>> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json(
      { data: null, error: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  const url       = new URL(req.url);
  const fromParam = url.searchParams.get('from');
  const toParam   = url.searchParams.get('to');

  // Default range = last 7 days, day-aligned UTC.
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);
  const defaultFrom = new Date(today);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 6);
  defaultFrom.setUTCHours(0, 0, 0, 0);

  const fromDate = fromParam ? new Date(`${fromParam}T00:00:00.000Z`) : defaultFrom;
  const toDate   = toParam   ? new Date(`${toParam}T23:59:59.999Z`)   : today;

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
    return NextResponse.json(
      { data: null, error: 'Invalid date range', success: false },
      { status: 400 },
    );
  }

  const rangeDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;

  // ── User's catalogues (id → {slug, title, is_active}) ────────────────────
  const { data: cats, error: catsError } = await supabaseAdmin
    .from('catalogues')
    .select('id, slug, title, is_active, view_count')
    .eq('user_id', session.user.id);

  if (catsError) {
    return NextResponse.json(
      { data: null, error: catsError.message, success: false },
      { status: 500 },
    );
  }

  const dayBuckets: { date: string; count: number }[] = [];
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(fromDate);
    d.setUTCDate(d.getUTCDate() + i);
    dayBuckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }

  const empty: CatalogueAnalyticsSummary = {
    total_catalogue_views: 0,
    total_ar_opens:        0,
    total_social_clicks:   0,
    active_catalogues:     cats?.filter((c) => c.is_active).length ?? 0,
    device_breakdown:      { ios: 0, android: 0, desktop: 0, unknown: 0 },
    social_breakdown:      {},
    daily_buckets:         dayBuckets,
    top_catalogues:        [],
    top_items:             [],
    range_days:            rangeDays,
  };

  if (!cats || cats.length === 0) {
    return NextResponse.json({ data: empty, error: null, success: true });
  }

  const catIds   = cats.map((c) => c.id);
  const catById  = new Map(cats.map((c) => [c.id, c]));

  // ── Events in range ──────────────────────────────────────────────────────
  const { data: events, error: eventsError } = await supabaseAdmin
    .from('catalogue_events')
    .select('catalogue_id, item_id, event_type, device_type, metadata, created_at')
    .in('catalogue_id', catIds)
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString());

  if (eventsError) {
    return NextResponse.json(
      { data: null, error: eventsError.message, success: false },
      { status: 500 },
    );
  }

  const summary    = { ...empty, daily_buckets: [...dayBuckets] };
  const dayMap     = new Map(dayBuckets.map((b, i) => [b.date, i]));
  const viewsByCat = new Map<string, number>();
  const opensByItem = new Map<string, number>();

  for (const ev of events ?? []) {
    if (ev.event_type === 'catalogue_view') {
      summary.total_catalogue_views++;
      const day = ev.created_at.slice(0, 10);
      const idx = dayMap.get(day);
      if (idx !== undefined) summary.daily_buckets[idx].count++;
      viewsByCat.set(ev.catalogue_id, (viewsByCat.get(ev.catalogue_id) ?? 0) + 1);

      switch (ev.device_type) {
        case 'ios':     summary.device_breakdown.ios++;     break;
        case 'android': summary.device_breakdown.android++; break;
        case 'desktop': summary.device_breakdown.desktop++; break;
        default:        summary.device_breakdown.unknown++;
      }
    } else if (ev.event_type === 'item_ar_open') {
      summary.total_ar_opens++;
      if (ev.item_id) {
        opensByItem.set(ev.item_id, (opensByItem.get(ev.item_id) ?? 0) + 1);
      }
    } else if (ev.event_type === 'social_click') {
      summary.total_social_clicks++;
      const key = (ev.metadata as { key?: string } | null)?.key;
      if (typeof key === 'string') {
        summary.social_breakdown[key] = (summary.social_breakdown[key] ?? 0) + 1;
      }
    }
  }

  // ── Top catalogues by views in range ─────────────────────────────────────
  summary.top_catalogues = Array.from(viewsByCat.entries())
    .map(([id, count]) => {
      const c = catById.get(id);
      if (!c) return null;
      return { id, slug: c.slug, title: c.title, view_count: count };
    })
    .filter((x): x is CatalogueAnalyticsTopCat => x !== null)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5);

  // ── Top items by AR opens in range ───────────────────────────────────────
  if (opensByItem.size > 0) {
    const itemIds = Array.from(opensByItem.keys());

    interface JoinedItem {
      id:           string;
      catalogue_id: string;
      custom_label: string | null;
      model:        Pick<Model3D, 'id' | 'name' | 'image_url'> | null;
    }

    const { data: itemsRaw } = await supabaseAdmin
      .from('catalogue_items')
      .select('id, catalogue_id, custom_label, model:models_3d(id, name, image_url)')
      .in('id', itemIds);

    const items = (itemsRaw ?? []) as unknown as JoinedItem[];

    summary.top_items = items
      .map((it) => {
        const cat = catById.get(it.catalogue_id);
        if (!cat) return null;
        return {
          id:             it.id,
          catalogue_id:   it.catalogue_id,
          catalogue_slug: cat.slug,
          label:          (it.custom_label && it.custom_label.trim()) || it.model?.name || 'Sans titre',
          image_url:      it.model?.image_url ?? null,
          ar_open_count:  opensByItem.get(it.id) ?? 0,
        };
      })
      .filter((x): x is CatalogueAnalyticsTopItem => x !== null)
      .sort((a, b) => b.ar_open_count - a.ar_open_count)
      .slice(0, 5);
  }

  return NextResponse.json({ data: summary, error: null, success: true });
}
