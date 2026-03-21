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

    const mockAlerts = [
      {
        id: crypto.randomUUID(),
        type: 'conflict',
        title: 'Conflicting refund policies detected',
        description: 'Slack message contradicts Notion doc on 30-day refund window',
        severity: 'high',
        status: 'open',
        knowledge_item_ids: [crypto.randomUUID(), crypto.randomUUID()],
        created_at: '2024-01-16T08:00:00Z',
      },
      {
        id: crypto.randomUUID(),
        type: 'stale',
        title: 'Deployment process may be outdated',
        description: 'Last confirmed 47 days ago, confidence dropped to 62%',
        severity: 'medium',
        status: 'open',
        knowledge_item_ids: [crypto.randomUUID()],
        created_at: '2024-01-16T05:00:00Z',
      },
      {
        id: crypto.randomUUID(),
        type: 'conflict',
        title: 'Pricing discrepancy for Growth plan',
        description: 'Website shows different price than internal docs',
        severity: 'high',
        status: 'open',
        knowledge_item_ids: [crypto.randomUUID()],
        created_at: '2024-01-15T14:00:00Z',
      },
    ];

    return NextResponse.json({ alerts: mockAlerts, total: mockAlerts.length });
  } catch (error) {
    console.error('Alerts list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
