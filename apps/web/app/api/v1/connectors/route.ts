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

    const mockConnectors = [
      {
        type: 'slack',
        name: 'Slack',
        status: 'connected',
        last_sync_at: '2024-01-16T10:30:00Z',
        item_count: 1247,
        config: { channels: ['#general', '#engineering', '#product'] },
      },
      {
        type: 'notion',
        name: 'Notion',
        status: 'connected',
        last_sync_at: '2024-01-16T09:00:00Z',
        item_count: 843,
        config: { workspace_id: 'ws_123' },
      },
      {
        type: 'jira',
        name: 'Jira',
        status: 'connected',
        last_sync_at: '2024-01-16T08:00:00Z',
        item_count: 356,
        config: { project_keys: ['ENG', 'PROD'] },
      },
      {
        type: 'github',
        name: 'GitHub',
        status: 'error',
        last_sync_at: '2024-01-16T07:00:00Z',
        item_count: 0,
        error: 'API rate limit exceeded',
      },
      {
        type: 'intercom',
        name: 'Intercom',
        status: 'connected',
        last_sync_at: '2024-01-16T07:30:00Z',
        item_count: 189,
        config: {},
      },
      {
        type: 'linear',
        name: 'Linear',
        status: 'connected',
        last_sync_at: '2024-01-16T06:00:00Z',
        item_count: 421,
        config: {},
      },
    ];

    return NextResponse.json({ connectors: mockConnectors });
  } catch (error) {
    console.error('Connectors list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
