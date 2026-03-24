export interface DocPage {
  slug: string;
  title: string;
}

export interface DocSection {
  title: string;
  slug: string;
  pages: DocPage[];
}

export const docsNavigation: DocSection[] = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    pages: [
      { slug: 'welcome', title: 'Welcome to TribeMem' },
      { slug: 'create-account', title: 'Create an account' },
      { slug: 'set-up-organization', title: 'Set up your organization' },
      { slug: 'first-connector', title: 'Your first connector' },
      { slug: 'first-query', title: 'Ask your first question' },
    ],
  },
  {
    title: 'Core Concepts',
    slug: 'core-concepts',
    pages: [
      { slug: 'knowledge-units', title: 'Knowledge units' },
      { slug: 'confidence-scores', title: 'Confidence scores' },
      { slug: 'temporal-versioning', title: 'Temporal versioning' },
      { slug: 'source-attribution', title: 'Source attribution' },
    ],
  },
  {
    title: 'Features',
    slug: 'features',
    pages: [
      { slug: 'dashboard', title: 'Dashboard & Overview' },
      { slug: 'ask', title: 'Ask — Query your knowledge' },
      { slug: 'knowledge-base', title: 'Knowledge Base' },
      { slug: 'connectors', title: 'Connectors' },
      { slug: 'crawler', title: 'Crawler' },
      { slug: 'alerts', title: 'Alerts' },
      { slug: 'team-management', title: 'Team management' },
    ],
  },
  {
    title: 'Integrations',
    slug: 'integrations',
    pages: [
      { slug: 'slack', title: 'Slack' },
      { slug: 'notion', title: 'Notion' },
      { slug: 'jira', title: 'Jira' },
      { slug: 'github', title: 'GitHub' },
      { slug: 'linear', title: 'Linear' },
      { slug: 'discord', title: 'Discord' },
      { slug: 'google-drive', title: 'Google Drive' },
      { slug: 'hubspot', title: 'HubSpot' },
      { slug: 'freshdesk', title: 'Freshdesk' },
    ],
  },
  {
    title: 'API',
    slug: 'api',
    pages: [
      { slug: 'authentication', title: 'Authentication' },
      { slug: 'knowledge-endpoints', title: 'Knowledge endpoints' },
      { slug: 'alerts-endpoints', title: 'Alerts endpoints' },
      { slug: 'connectors-endpoints', title: 'Connectors endpoints' },
      { slug: 'team-billing-endpoints', title: 'Team & Billing endpoints' },
      { slug: 'rate-limits', title: 'Rate limits & error codes' },
    ],
  },
  {
    title: 'MCP Server',
    slug: 'mcp',
    pages: [
      { slug: 'what-is-mcp', title: 'What is MCP?' },
      { slug: 'setup', title: 'Setup' },
      { slug: 'available-tools', title: 'Available tools' },
    ],
  },
  {
    title: 'SDK',
    slug: 'sdk',
    pages: [
      { slug: 'installation', title: 'Installation' },
      { slug: 'configuration', title: 'Configuration' },
      { slug: 'examples', title: 'Examples' },
    ],
  },
  {
    title: 'Administration',
    slug: 'administration',
    pages: [
      { slug: 'organization-settings', title: 'Organization settings' },
      { slug: 'billing', title: 'Billing & Subscriptions' },
      { slug: 'api-keys', title: 'Managing API Keys' },
      { slug: 'roles-permissions', title: 'Roles & permissions' },
    ],
  },
  {
    title: 'FAQ',
    slug: 'faq',
    pages: [
      { slug: 'frequently-asked-questions', title: 'Frequently asked questions' },
    ],
  },
];

export function findDocBySlug(slugParts: string[]): { section: DocSection; page: DocPage } | null {
  if (slugParts.length !== 2) return null;
  const [sectionSlug, pageSlug] = slugParts;
  const section = docsNavigation.find((s) => s.slug === sectionSlug);
  if (!section) return null;
  const page = section.pages.find((p) => p.slug === pageSlug);
  if (!page) return null;
  return { section, page };
}

export function getFirstDocPath(): string {
  const first = docsNavigation[0];
  return `/docs/${first.slug}/${first.pages[0].slug}`;
}

export function getAdjacentPages(slugParts: string[]): { prev: { path: string; title: string } | null; next: { path: string; title: string } | null } {
  const allPages: { path: string; title: string }[] = [];
  for (const section of docsNavigation) {
    for (const page of section.pages) {
      allPages.push({ path: `/docs/${section.slug}/${page.slug}`, title: page.title });
    }
  }
  const currentPath = `/docs/${slugParts.join('/')}`;
  const idx = allPages.findIndex((p) => p.path === currentPath);
  return {
    prev: idx > 0 ? allPages[idx - 1] : null,
    next: idx < allPages.length - 1 ? allPages[idx + 1] : null,
  };
}
