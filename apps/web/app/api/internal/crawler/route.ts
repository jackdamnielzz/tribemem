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
    const { connector_id, org_id, crawl_type, config } = body;

    if (!connector_id || !org_id) {
      return NextResponse.json(
        { error: 'connector_id and org_id are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify the connector exists and belongs to the org
    const { data: connector, error: connectorError } = await supabase
      .from('connectors')
      .select('id, type, status')
      .eq('id', connector_id)
      .eq('org_id', org_id)
      .single();

    if (connectorError || !connector) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    if (connector.status !== 'connected') {
      return NextResponse.json(
        { error: 'Connector is not in a connected state' },
        { status: 400 }
      );
    }

    // Create a new crawler run
    const { data: crawlerRun, error: runError } = await supabase
      .from('crawler_runs')
      .insert({
        connector_id,
        org_id,
        crawl_type: crawl_type || 'full',
        status: 'pending',
        config: config || {},
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error('Crawler start error:', runError);
      return NextResponse.json({ error: 'Failed to create crawler run' }, { status: 500 });
    }

    return NextResponse.json({ crawler_run: crawlerRun }, { status: 201 });
  } catch (error) {
    console.error('Crawler start error:', error);
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

    let query = supabase
      .from('crawler_runs')
      .select('*')
      .eq('org_id', orgId)
      .order('started_at', { ascending: false })
      .limit(50);

    if (connectorId) {
      query = query.eq('connector_id', connectorId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: runs, error } = await query;

    if (error) {
      console.error('Crawler status error:', error);
      return NextResponse.json({ error: 'Failed to fetch crawler runs' }, { status: 500 });
    }

    return NextResponse.json({ runs, total: runs.length });
  } catch (error) {
    console.error('Crawler status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!verifyServiceRole()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { run_id, status, items_crawled, items_failed, error_message } = body;

    if (!run_id || !status) {
      return NextResponse.json(
        { error: 'run_id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (items_crawled !== undefined) updateData.items_crawled = items_crawled;
    if (items_failed !== undefined) updateData.items_failed = items_failed;
    if (error_message) updateData.error_message = error_message;
    if (status === 'completed' || status === 'failed') {
      updateData.finished_at = new Date().toISOString();
    }

    const { data: run, error: updateError } = await supabase
      .from('crawler_runs')
      .update(updateData)
      .eq('id', run_id)
      .select()
      .single();

    if (updateError) {
      console.error('Crawler update error:', updateError);
      return NextResponse.json({ error: 'Failed to update crawler run' }, { status: 500 });
    }

    return NextResponse.json({ crawler_run: run });
  } catch (error) {
    console.error('Crawler update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
