import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseState, exchangeCode, getProvider } from '@/lib/oauth/providers';
import { encryptCredentials } from '@/lib/oauth/encryption';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth provider errors (e.g. user denied access)
  if (error) {
    console.error(`[OAuth Callback] Provider error: ${error} - ${errorDescription}`);
    return NextResponse.redirect(
      `${origin}/connectors?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${origin}/connectors?error=${encodeURIComponent('Missing authorization code or state parameter')}`,
    );
  }

  // Parse the state to determine which connector type and org this is for
  let connectorType: string;
  let orgId: string;

  try {
    const state = parseState(stateParam);
    connectorType = state.connectorType;
    orgId = state.orgId;
  } catch (err) {
    console.error('[OAuth Callback] Invalid state:', err);
    return NextResponse.redirect(
      `${origin}/connectors?error=${encodeURIComponent('Invalid OAuth state parameter')}`,
    );
  }

  // Verify the provider exists
  const provider = getProvider(connectorType);
  if (!provider) {
    return NextResponse.redirect(
      `${origin}/connectors?error=${encodeURIComponent(`Unsupported connector type: ${connectorType}`)}`,
    );
  }

  // Verify user is authenticated
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?error=unauthorized&next=/connectors`,
    );
  }

  // Verify user belongs to the org
  const { data: membership } = await supabase
    .from('members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.redirect(
      `${origin}/connectors?error=${encodeURIComponent('You do not have access to this organization')}`,
    );
  }

  try {
    // Build the redirect URI (same URL as this callback route)
    const callbackUrl = `${origin}/api/auth/connectors/callback`;

    // Exchange the authorization code for tokens
    const tokenResult = await exchangeCode(connectorType, code, callbackUrl);

    // Build the credentials object to store
    const credentials: Record<string, unknown> = {
      access_token: tokenResult.access_token,
    };

    if (tokenResult.refresh_token) {
      credentials.refresh_token = tokenResult.refresh_token;
    }

    if (tokenResult.expires_in) {
      credentials.expires_at = new Date(
        Date.now() + tokenResult.expires_in * 1000,
      ).toISOString();
    }

    if (tokenResult.scope) {
      credentials.scope = tokenResult.scope;
    }

    // Store provider-specific extra fields
    const extraFields = await extractExtraFields(
      connectorType,
      tokenResult.access_token,
      tokenResult.raw,
    );
    if (Object.keys(extraFields).length > 0) {
      credentials.extra = extraFields;
    }

    // Encrypt credentials for storage
    const encryptedCredentials = encryptCredentials(credentials);

    // Build scopes array for the config
    const scopes = tokenResult.scope
      ? tokenResult.scope.split(/[,\s]+/).filter(Boolean)
      : provider.scopes;

    // Check if a connector already exists for this org and type
    const { data: existingConnector } = await supabase
      .from('connectors')
      .select('id')
      .eq('org_id', orgId)
      .eq('type', provider.connectorType)
      .single();

    if (existingConnector) {
      // Update the existing connector
      const { error: updateError } = await supabase
        .from('connectors')
        .update({
          status: 'active',
          credentials_encrypted: encryptedCredentials,
          config: {
            scopes,
            settings: {},
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnector.id);

      if (updateError) {
        throw new Error(`Failed to update connector: ${updateError.message}`);
      }
    } else {
      // Create a new connector record
      const { error: insertError } = await supabase.from('connectors').insert({
        org_id: orgId,
        type: provider.connectorType,
        status: 'active',
        display_name: provider.name,
        credentials_encrypted: encryptedCredentials,
        config: {
          scopes,
          settings: {},
        },
        created_by: user.id,
        events_processed: 0,
      });

      if (insertError) {
        throw new Error(`Failed to create connector: ${insertError.message}`);
      }
    }

    return NextResponse.redirect(
      `${origin}/connectors?success=${encodeURIComponent(`${provider.name} connected successfully`)}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[OAuth Callback] Error for ${connectorType}:`, message);

    return NextResponse.redirect(
      `${origin}/connectors?error=${encodeURIComponent(`Failed to connect ${provider.name}: ${message}`)}`,
    );
  }
}

/**
 * Extract provider-specific extra fields from the token response
 * that should be stored alongside the access token.
 */
async function extractExtraFields(
  connectorType: string,
  accessToken: string,
  rawResponse: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const extra: Record<string, unknown> = {};

  switch (connectorType) {
    case 'slack':
      if (rawResponse.team) {
        const team = rawResponse.team as Record<string, unknown>;
        extra.team_id = team.id;
        extra.team_name = team.name;
      }
      if (rawResponse.bot_user_id) {
        extra.bot_user_id = rawResponse.bot_user_id;
      }
      break;

    case 'notion':
      if (rawResponse.workspace_id) {
        extra.workspace_id = rawResponse.workspace_id;
      }
      if (rawResponse.workspace_name) {
        extra.workspace_name = rawResponse.workspace_name;
      }
      if (rawResponse.bot_id) {
        extra.bot_id = rawResponse.bot_id;
      }
      break;

    case 'github':
      if (rawResponse.token_type) {
        extra.token_type = rawResponse.token_type;
      }
      break;

    case 'jira': {
      // Jira requires fetching accessible resources to get the cloud_id
      try {
        const resourcesResponse = await fetch(
          'https://api.atlassian.com/oauth/token/accessible-resources',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (resourcesResponse.ok) {
          const resources = (await resourcesResponse.json()) as Array<
            Record<string, unknown>
          >;
          const site = resources[0];
          if (site) {
            extra.cloud_id = site.id;
            extra.site_url = site.url;
            extra.site_name = site.name;
          }
        }
      } catch (err) {
        console.warn(
          '[OAuth Callback] Failed to fetch Jira accessible resources:',
          err,
        );
      }
      break;
    }

    default:
      break;
  }

  return extra;
}
