import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function verifyServiceRole(): boolean {
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === process.env.INTERNAL_SERVICE_KEY;
}

function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  if (!verifyServiceRole()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { raw_event_ids, org_id, connector_id, priority } = body;

    if (!raw_event_ids || !Array.isArray(raw_event_ids) || raw_event_ids.length === 0) {
      return NextResponse.json(
        { error: 'raw_event_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    // Verify the raw events exist and belong to the org
    const { data: events, error: eventsError } = await supabase
      .from('raw_events')
      .select('id, connector_id, event_type')
      .in('id', raw_event_ids)
      .eq('org_id', org_id);

    if (eventsError) {
      console.error('Extraction trigger error:', eventsError);
      return NextResponse.json({ error: 'Failed to verify raw events' }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'No matching raw events found' }, { status: 404 });
    }

    // Create extraction jobs for each raw event
    const jobs = events.map((event) => ({
      raw_event_id: event.id,
      connector_id: connector_id || event.connector_id,
      org_id,
      event_type: event.event_type,
      status: 'pending' as const,
      priority: priority || 'normal',
      created_at: new Date().toISOString(),
    }));

    const { data: createdJobs, error: insertError } = await supabase
      .from('extraction_jobs')
      .insert(jobs)
      .select('id, raw_event_id, status');

    if (insertError) {
      console.error('Extraction trigger error:', insertError);
      return NextResponse.json({ error: 'Failed to create extraction jobs' }, { status: 500 });
    }

    return NextResponse.json(
      {
        jobs: createdJobs,
        total_queued: createdJobs?.length || 0,
        skipped: raw_event_ids.length - (events?.length || 0),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Extraction trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!verifyServiceRole()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const connectorId = searchParams.get('connector_id');
    const status = searchParams.get('status');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    // Get extraction job stats
    let statsQuery = supabase
      .from('extraction_jobs')
      .select('status', { count: 'exact' })
      .eq('org_id', orgId);

    if (connectorId) {
      statsQuery = statsQuery.eq('connector_id', connectorId);
    }

    const { data: allJobs, error: statsError } = await statsQuery;

    if (statsError) {
      console.error('Extraction stats error:', statsError);
      return NextResponse.json({ error: 'Failed to fetch extraction stats' }, { status: 500 });
    }

    // Aggregate counts by status
    const statusCounts: Record<string, number> = {};
    for (const job of allJobs || []) {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    }

    // Get recent jobs if a specific status is requested
    let recentJobs = null;
    if (status) {
      let recentQuery = supabase
        .from('extraction_jobs')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(50);

      if (connectorId) {
        recentQuery = recentQuery.eq('connector_id', connectorId);
      }

      const { data, error } = await recentQuery;
      if (error) {
        console.error('Extraction recent jobs error:', error);
      } else {
        recentJobs = data;
      }
    }

    return NextResponse.json({
      stats: {
        total: allJobs?.length || 0,
        by_status: statusCounts,
      },
      ...(recentJobs && { jobs: recentJobs }),
    });
  } catch (error) {
    console.error('Extraction stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
