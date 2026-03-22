import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
    const { data: member } = await supabase
      .from('members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Fetch all connectors for this org
    const { data: connectors, error } = await supabase
      .from('connectors')
      .select('id, type, status, display_name, config, last_sync_at, last_error, events_processed, created_at')
      .eq('org_id', member.organization_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Connectors list error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch connectors' }, { status: 500 });
    }

    return NextResponse.json({ connectors: connectors || [] });
  } catch (error) {
    console.error('Connectors list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
