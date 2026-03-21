import type { ConnectorType } from '../types/connector';

export interface ConnectorMetadata {
  type: ConnectorType;
  name: string;
  description: string;
  logoPlaceholder: string;
  category: 'communication' | 'documentation' | 'project_management' | 'support' | 'storage' | 'crm' | 'other';
  requiredScopes: string[];
  optionalScopes: string[];
  authMethod: 'oauth2' | 'api_key' | 'webhook';
  docsUrl: string;
}

export const CONNECTOR_METADATA: Record<ConnectorType, ConnectorMetadata> = {
  slack: {
    type: 'slack',
    name: 'Slack',
    description: 'Import knowledge from Slack channels and threads',
    logoPlaceholder: '/connectors/slack.svg',
    category: 'communication',
    requiredScopes: [
      'channels:history',
      'channels:read',
      'groups:history',
      'groups:read',
      'users:read',
    ],
    optionalScopes: [
      'reactions:read',
      'files:read',
      'bookmarks:read',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://api.slack.com/scopes',
  },
  teams: {
    type: 'teams',
    name: 'Microsoft Teams',
    description: 'Import knowledge from Teams channels and chats',
    logoPlaceholder: '/connectors/teams.svg',
    category: 'communication',
    requiredScopes: [
      'ChannelMessage.Read.All',
      'Channel.ReadBasic.All',
      'Team.ReadBasic.All',
      'User.Read.All',
    ],
    optionalScopes: [
      'Chat.Read.All',
      'Files.Read.All',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/permissions-reference',
  },
  notion: {
    type: 'notion',
    name: 'Notion',
    description: 'Import knowledge from Notion pages and databases',
    logoPlaceholder: '/connectors/notion.svg',
    category: 'documentation',
    requiredScopes: [
      'read_content',
      'read_user_information',
    ],
    optionalScopes: [
      'read_comments',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://developers.notion.com/reference/capabilities',
  },
  confluence: {
    type: 'confluence',
    name: 'Confluence',
    description: 'Import knowledge from Confluence spaces and pages',
    logoPlaceholder: '/connectors/confluence.svg',
    category: 'documentation',
    requiredScopes: [
      'read:confluence-content.all',
      'read:confluence-space.summary',
      'read:confluence-user',
    ],
    optionalScopes: [
      'read:confluence-content.summary',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://developer.atlassian.com/cloud/confluence/scopes-for-oauth-2-3LO-and-forge-apps/',
  },
  jira: {
    type: 'jira',
    name: 'Jira',
    description: 'Import knowledge from Jira issues and projects',
    logoPlaceholder: '/connectors/jira.svg',
    category: 'project_management',
    requiredScopes: [
      'read:jira-work',
      'read:jira-user',
    ],
    optionalScopes: [
      'read:jira-project',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/scopes-for-oauth-2-3LO-and-forge-apps/',
  },
  linear: {
    type: 'linear',
    name: 'Linear',
    description: 'Import knowledge from Linear issues and projects',
    logoPlaceholder: '/connectors/linear.svg',
    category: 'project_management',
    requiredScopes: [
      'read',
    ],
    optionalScopes: [
      'issues:read',
      'comments:read',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://developers.linear.app/docs/oauth/authentication',
  },
  github: {
    type: 'github',
    name: 'GitHub',
    description: 'Import knowledge from GitHub issues, PRs, and discussions',
    logoPlaceholder: '/connectors/github.svg',
    category: 'project_management',
    requiredScopes: [
      'repo:read',
      'read:org',
      'read:discussion',
    ],
    optionalScopes: [
      'read:project',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps',
  },
  gitlab: {
    type: 'gitlab',
    name: 'GitLab',
    description: 'Import knowledge from GitLab issues, MRs, and wikis',
    logoPlaceholder: '/connectors/gitlab.svg',
    category: 'project_management',
    requiredScopes: [
      'read_api',
      'read_repository',
    ],
    optionalScopes: [
      'read_user',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://docs.gitlab.com/ee/integration/oauth_provider.html',
  },
  intercom: {
    type: 'intercom',
    name: 'Intercom',
    description: 'Import knowledge from Intercom conversations and articles',
    logoPlaceholder: '/connectors/intercom.svg',
    category: 'support',
    requiredScopes: [
      'read_conversations',
      'read_articles',
      'read_users',
    ],
    optionalScopes: [
      'read_tags',
      'read_companies',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://developers.intercom.com/docs/build-an-integration/learn-more/authentication/',
  },
  zendesk: {
    type: 'zendesk',
    name: 'Zendesk',
    description: 'Import knowledge from Zendesk tickets and help center articles',
    logoPlaceholder: '/connectors/zendesk.svg',
    category: 'support',
    requiredScopes: [
      'read',
      'tickets:read',
      'hc:read',
    ],
    optionalScopes: [
      'users:read',
      'organizations:read',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://developer.zendesk.com/api-reference/introduction/security-and-auth/',
  },
  freshdesk: {
    type: 'freshdesk',
    name: 'Freshdesk',
    description: 'Import knowledge from Freshdesk tickets and solutions',
    logoPlaceholder: '/connectors/freshdesk.svg',
    category: 'support',
    requiredScopes: [],
    optionalScopes: [],
    authMethod: 'api_key',
    docsUrl: 'https://developers.freshdesk.com/api/',
  },
  google_drive: {
    type: 'google_drive',
    name: 'Google Drive',
    description: 'Import knowledge from Google Docs, Sheets, and Slides',
    logoPlaceholder: '/connectors/google_drive.svg',
    category: 'storage',
    requiredScopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
    ],
    optionalScopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/presentations.readonly',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://developers.google.com/drive/api/guides/api-specific-auth',
  },
  hubspot: {
    type: 'hubspot',
    name: 'HubSpot',
    description: 'Import knowledge from HubSpot CRM, deals, and notes',
    logoPlaceholder: '/connectors/hubspot.svg',
    category: 'crm',
    requiredScopes: [
      'crm.objects.contacts.read',
      'crm.objects.companies.read',
      'crm.objects.deals.read',
    ],
    optionalScopes: [
      'crm.objects.custom.read',
      'sales-email-read',
    ],
    authMethod: 'oauth2',
    docsUrl: 'https://developers.hubspot.com/docs/api/working-with-oauth',
  },
  stripe: {
    type: 'stripe',
    name: 'Stripe',
    description: 'Import knowledge from Stripe events, customers, and subscriptions',
    logoPlaceholder: '/connectors/stripe.svg',
    category: 'other',
    requiredScopes: [],
    optionalScopes: [],
    authMethod: 'api_key',
    docsUrl: 'https://stripe.com/docs/api/authentication',
  },
};

/**
 * Returns metadata for a given connector type.
 */
export function getConnectorMetadata(type: ConnectorType): ConnectorMetadata {
  return CONNECTOR_METADATA[type];
}

/**
 * Returns all connector types grouped by category.
 */
export function getConnectorsByCategory(): Record<string, ConnectorMetadata[]> {
  const grouped: Record<string, ConnectorMetadata[]> = {};
  for (const connector of Object.values(CONNECTOR_METADATA)) {
    if (!grouped[connector.category]) {
      grouped[connector.category] = [];
    }
    grouped[connector.category].push(connector);
  }
  return grouped;
}
