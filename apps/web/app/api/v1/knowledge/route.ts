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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock response
    const mockItems = [
      {
        id: crypto.randomUUID(),
        title: 'Enterprise refund window is 30 days',
        type: 'fact',
        category: 'Policy',
        confidence: 0.95,
        status: 'active',
        source_count: 4,
        last_confirmed_at: '2024-01-15T00:00:00Z',
        created_at: '2023-06-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: crypto.randomUUID(),
        title: 'Production deployment requires staging approval',
        type: 'process',
        category: 'Engineering',
        confidence: 0.93,
        status: 'active',
        source_count: 6,
        last_confirmed_at: '2024-01-14T00:00:00Z',
        created_at: '2023-07-15T00:00:00Z',
        updated_at: '2024-01-14T00:00:00Z',
      },
    ];

    return NextResponse.json({
      items: mockItems,
      total: mockItems.length,
      page,
      limit,
      has_more: false,
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

    const body = await request.json();
    const { title, type, category, content } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const mockItem = {
      id: crypto.randomUUID(),
      title,
      type,
      category: category || 'General',
      content: content || '',
      confidence: 1.0,
      status: 'active',
      source_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(mockItem, { status: 201 });
  } catch (error) {
    console.error('Knowledge create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
