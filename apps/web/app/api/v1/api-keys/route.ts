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

    const { data: member } = await supabase
      .from('members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, is_active, last_used_at, created_at')
      .eq('org_id', member.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API keys list error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    return NextResponse.json({ keys: keys || [] });
  } catch (error) {
    console.error('API keys list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
