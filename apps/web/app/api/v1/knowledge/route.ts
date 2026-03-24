import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('knowledge_units')
      .select('id, type, category, title, content, confidence_score, evidence_count, status, is_current, tags, created_at, updated_at', { count: 'exact' })
      .eq('org_id', member.organization_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data: items, count, error } = await query;

    if (error) {
      console.error('Knowledge list error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch knowledge' }, { status: 500 });
    }

    return NextResponse.json({
      items: items || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Knowledge list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { title, type, category, content } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('knowledge_units')
      .insert({
        org_id: member.organization_id,
        title,
        type,
        category: category || 'General',
        content: content || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Knowledge create error:', error.message);
      return NextResponse.json({ error: 'Failed to create knowledge item' }, { status: 500 });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Knowledge create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
