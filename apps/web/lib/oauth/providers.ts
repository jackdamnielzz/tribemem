export interface OAuthProvider {
  name: string;
  /** The connector type as stored in the database */
  connectorType: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  /** Content-Type for the token exchange request (default: 'application/x-www-form-urlencoded') */
  tokenContentType?: 'application/json' | 'application/x-www-form-urlencoded';
  /** Additional static params to include in the authorization URL */
  authParams?: Record<string, string>;
  /** Custom token exchange behavior (e.g. Notion uses Basic auth) */
  tokenAuthMethod?: 'body' | 'basic';
  /** Field name for the access token in the token response (default: 'access_token') */
  tokenField?: string;
}

const providers: Record<string, OAuthProvider> = {
  slack: {
    name: 'Slack',
    connectorType: 'slack',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: [
      'channels:history',
      'channels:read',
      'groups:history',
      'groups:read',
      'users:read',
      'team:read',
    ],
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    tokenContentType: 'application/x-www-form-urlencoded',
    tokenAuthMethod: 'body',
  },

  notion: {
    name: 'Notion',
    connectorType: 'notion',
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [], // Notion uses integration capabilities, not OAuth scopes
    clientId: process.env.NOTION_CLIENT_ID || '',
    clientSecret: process.env.NOTION_CLIENT_SECRET || '',
    tokenContentType: 'application/json',
    tokenAuthMethod: 'basic',
    authParams: {
      response_type: 'code',
      owner: 'user',
    },
  },

  github: {
    name: 'GitHub',
    connectorType: 'github',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'read:org'],
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    tokenContentType: 'application/json',
    tokenAuthMethod: 'body',
  },

  jira: {
    name: 'Jira',
    connectorType: 'jira',
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:jira-work', 'read:jira-user', 'offline_access'],
    clientId: process.env.JIRA_CLIENT_ID || '',
    clientSecret: process.env.JIRA_CLIENT_SECRET || '',
    tokenContentType: 'application/json',
    tokenAuthMethod: 'body',
    authParams: {
      audience: 'api.atlassian.com',
      response_type: 'code',
      prompt: 'consent',
    },
  },

  intercom: {
    name: 'Intercom',
    connectorType: 'intercom',
    authUrl: 'https://app.intercom.com/oauth',
    tokenUrl: 'https://api.intercom.io/auth/eagle/token',
    scopes: [],
    clientId: process.env.INTERCOM_CLIENT_ID || '',
    clientSecret: process.env.INTERCOM_CLIENT_SECRET || '',
    tokenContentType: 'application/json',
    tokenAuthMethod: 'body',
    tokenField: 'token',
  },

  linear: {
    name: 'Linear',
    connectorType: 'linear',
    authUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    scopes: ['read'],
    clientId: process.env.LINEAR_CLIENT_ID || '',
    clientSecret: process.env.LINEAR_CLIENT_SECRET || '',
    tokenContentType: 'application/x-www-form-urlencoded',
    tokenAuthMethod: 'body',
    authParams: {
      response_type: 'code',
      prompt: 'consent',
    },
  },

  'google-drive': {
    name: 'Google Drive',
    connectorType: 'google_drive',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    tokenContentType: 'application/x-www-form-urlencoded',
    tokenAuthMethod: 'body',
    authParams: {
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    },
  },

  discord: {
    name: 'Discord',
    connectorType: 'discord',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['identify', 'guilds', 'guilds.members.read', 'messages.read'],
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    tokenContentType: 'application/x-www-form-urlencoded',
    tokenAuthMethod: 'body',
    authParams: {
      response_type: 'code',
    },
  },

  hubspot: {
    name: 'HubSpot',
    connectorType: 'hubspot',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: [
      'crm.objects.contacts.read',
      'crm.objects.companies.read',
      'crm.objects.deals.read',
      'tickets',
    ],
    clientId: process.env.HUBSPOT_CLIENT_ID || '',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
    tokenContentType: 'application/x-www-form-urlencoded',
    tokenAuthMethod: 'body',
  },
};

/**
 * Get a provider by its key (the URL-friendly connector name).
 */
export function getProvider(providerKey: string): OAuthProvider | null {
  return providers[providerKey] ?? null;
}

/**
 * Get all available OAuth providers.
 */
export function getAllProviders(): Record<string, OAuthProvider> {
  return providers;
}

interface AuthorizationUrlState {
  connectorType: string;
  orgId: string;
}

/**
 * Build the full OAuth authorization URL for a given provider.
 * Encodes { connectorType, orgId } into the state parameter.
 */
export function getAuthorizationUrl(
  providerKey: string,
  orgId: string,
  redirectUri: string,
): string {
  const provider = getProvider(providerKey);
  if (!provider) {
    throw new Error(`Unknown OAuth provider: ${providerKey}`);
  }

  const state: AuthorizationUrlState = {
    connectorType: providerKey,
    orgId,
  };

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    state: Buffer.from(JSON.stringify(state)).toString('base64'),
    ...provider.authParams,
  });

  // Add scopes - Slack uses comma separator, others use space
  if (provider.scopes.length > 0) {
    const separator = providerKey === 'slack' ? ',' : ' ';
    params.set('scope', provider.scopes.join(separator));
  }

  return `${provider.authUrl}?${params.toString()}`;
}

/**
 * Parse the state parameter from the OAuth callback.
 */
export function parseState(stateParam: string): AuthorizationUrlState {
  try {
    const decoded = Buffer.from(stateParam, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as AuthorizationUrlState;

    if (!parsed.connectorType || !parsed.orgId) {
      throw new Error('Missing required fields in state');
    }

    return parsed;
  } catch (err) {
    throw new Error(
      `Invalid OAuth state parameter: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export interface TokenExchangeResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  /** All raw fields from the token response */
  raw: Record<string, unknown>;
}

/**
 * Exchange an authorization code for access and refresh tokens.
 */
export async function exchangeCode(
  providerKey: string,
  code: string,
  redirectUri: string,
): Promise<TokenExchangeResult> {
  const provider = getProvider(providerKey);
  if (!provider) {
    throw new Error(`Unknown OAuth provider: ${providerKey}`);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  let body: string;

  if (provider.tokenContentType === 'application/json') {
    headers['Content-Type'] = 'application/json';

    const bodyObj: Record<string, string> = {
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };

    // Some providers (e.g. Notion) use Basic auth instead of sending credentials in body
    if (provider.tokenAuthMethod === 'basic') {
      const encoded = Buffer.from(
        `${provider.clientId}:${provider.clientSecret}`,
      ).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    } else {
      bodyObj.client_id = provider.clientId;
      bodyObj.client_secret = provider.clientSecret;
    }

    body = JSON.stringify(bodyObj);
  } else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';

    const formData = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
    });

    body = formData.toString();
  }

  // Notion requires Notion-Version header
  if (providerKey === 'notion') {
    headers['Notion-Version'] = '2022-06-28';
  }

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `${provider.name} token exchange failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  // Check for error in response body (GitHub returns 200 with error field)
  if (data.error) {
    throw new Error(
      `${provider.name} OAuth error: ${(data.error_description as string) || (data.error as string)}`,
    );
  }

  const tokenField = provider.tokenField || 'access_token';
  const accessToken = data[tokenField] as string;

  if (!accessToken) {
    throw new Error(
      `${provider.name} token exchange did not return an access token`,
    );
  }

  return {
    access_token: accessToken,
    refresh_token: data.refresh_token as string | undefined,
    expires_in: data.expires_in as number | undefined,
    scope: data.scope as string | undefined,
    token_type: data.token_type as string | undefined,
    raw: data,
  };
}
