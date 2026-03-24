import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: item, error } = await supabase
      .from('knowledge_units')
      .select('id, type, category, title, content, confidence_score, evidence_count, status, is_current, tags, created_at, updated_at')
      .eq('id', params.id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    // Fetch sources for this knowledge unit
    const { data: sources } = await supabase
      .from('sources')
      .select('id, source_url, source_title, source_snippet, source_timestamp, created_at')
      .eq('knowledge_unit_id', params.id);

    return NextResponse.json({ ...item, sources: sources || [] });
  } catch (error) {
    console.error('Knowledge get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { title, category, content, status } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;

    const { data: item, error } = await supabase
      .from('knowledge_units')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Knowledge update error:', error.message);
      return NextResponse.json({ error: 'Failed to update knowledge item' }, { status: 500 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Knowledge update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
