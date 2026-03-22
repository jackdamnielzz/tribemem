import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthorizationUrl, getProvider } from '@/lib/oauth/providers';

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

    // Verify the connector type is supported
    const provider = getProvider(type);
    if (!provider) {
      return NextResponse.json({ error: `Unsupported connector type: ${type}` }, { status: 400 });
    }

    // Get orgId from request body
    const body = (await request.json()) as { org_id?: string };
    const orgId = body.org_id;

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Verify user belongs to the org
    const { data: membership } = await supabase
      .from('members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 });
    }

    // Build the OAuth callback URL
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/auth/connectors/callback`;

    // Generate the authorization URL with encoded state
    const oauthUrl = getAuthorizationUrl(type, orgId, redirectUri);

    return NextResponse.json({
      oauth_url: oauthUrl,
      connector_type: type,
    });
  } catch (error) {
    console.error('Connector connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
