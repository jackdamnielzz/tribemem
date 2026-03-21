import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { type: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = params;

    const supportedConnectors = ['slack', 'notion', 'jira', 'github', 'intercom', 'linear', 'google-drive', 'hubspot', 'confluence'];

    if (!supportedConnectors.includes(type)) {
      return NextResponse.json({ error: `Unsupported connector type: ${type}` }, { status: 400 });
    }

    // In production, this would generate OAuth URL and redirect
    const mockOAuthUrl = `https://oauth.example.com/${type}/authorize?client_id=mock&redirect_uri=${encodeURIComponent(`${request.url}/callback`)}`;

    return NextResponse.json({
      oauth_url: mockOAuthUrl,
      connector_type: type,
      message: `Initiate OAuth flow for ${type}`,
    });
  } catch (error) {
    console.error('Connector connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
