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

    // Mock response
    const mockItem = {
      id: params.id,
      title: 'Enterprise refund window is 30 days',
      type: 'fact',
      category: 'Policy',
      content: 'The enterprise refund policy allows customers to request a full refund within 30 days of purchase.',
      confidence: 0.95,
      status: 'active',
      sources: [
        {
          id: crypto.randomUUID(),
          connector_type: 'notion',
          title: 'Refund Policy Documentation',
          url: 'https://notion.so/example',
          extracted_at: '2024-01-10T00:00:00Z',
        },
        {
          id: crypto.randomUUID(),
          connector_type: 'slack',
          title: '#policy-updates discussion',
          url: 'https://slack.com/example',
          extracted_at: '2024-01-15T00:00:00Z',
        },
      ],
      last_confirmed_at: '2024-01-15T00:00:00Z',
      created_at: '2023-06-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    };

    return NextResponse.json(mockItem);
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

    const mockUpdated = {
      id: params.id,
      ...body,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(mockUpdated);
  } catch (error) {
    console.error('Knowledge update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
