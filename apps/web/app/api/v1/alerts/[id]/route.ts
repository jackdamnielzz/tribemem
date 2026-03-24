import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { is_resolved, is_read } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof is_resolved === 'boolean') {
      updates.is_resolved = is_resolved;
      if (is_resolved) {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user.id;
      } else {
        updates.resolved_at = null;
        updates.resolved_by = null;
      }
    }

    if (typeof is_read === 'boolean') {
      updates.is_read = is_read;
    }

    const { data: alert, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Alert update error:', error.message);
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
