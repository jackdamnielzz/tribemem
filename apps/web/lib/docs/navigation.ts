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
    title: 'Aan de slag',
    slug: 'aan-de-slag',
    pages: [
      { slug: 'welkom', title: 'Welkom bij TribeMem' },
      { slug: 'account-aanmaken', title: 'Account aanmaken' },
      { slug: 'organisatie-opzetten', title: 'Organisatie opzetten' },
      { slug: 'eerste-connector', title: 'Je eerste connector' },
      { slug: 'eerste-vraag', title: 'Je eerste vraag stellen' },
    ],
  },
  {
    title: 'Kernconcepten',
    slug: 'kernconcepten',
    pages: [
      { slug: 'kenniseenheden', title: 'Kenniseenheden' },
      { slug: 'confidence-scores', title: 'Confidence scores' },
      { slug: 'temporele-versioning', title: 'Temporele versioning' },
      { slug: 'bronverwijzingen', title: 'Bronverwijzingen' },
    ],
  },
  {
    title: 'Functies',
    slug: 'functies',
    pages: [
      { slug: 'dashboard', title: 'Dashboard & Overzicht' },
      { slug: 'ask', title: 'Ask — Vragen stellen' },
      { slug: 'knowledge-base', title: 'Knowledge Base' },
      { slug: 'connectors', title: 'Connectors' },
      { slug: 'crawler', title: 'Crawler' },
      { slug: 'meldingen', title: 'Meldingen' },
      { slug: 'team-beheer', title: 'Team beheer' },
    ],
  },
  {
    title: 'Integraties',
    slug: 'integraties',
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
      { slug: 'authenticatie', title: 'Authenticatie' },
      { slug: 'knowledge-endpoints', title: 'Knowledge endpoints' },
      { slug: 'alerts-endpoints', title: 'Alerts endpoints' },
      { slug: 'connectors-endpoints', title: 'Connectors endpoints' },
      { slug: 'team-billing-endpoints', title: 'Team & Billing endpoints' },
      { slug: 'rate-limits', title: 'Rate limits & foutcodes' },
    ],
  },
  {
    title: 'MCP Server',
    slug: 'mcp',
    pages: [
      { slug: 'wat-is-mcp', title: 'Wat is MCP?' },
      { slug: 'setup', title: 'Setup' },
      { slug: 'beschikbare-tools', title: 'Beschikbare tools' },
    ],
  },
  {
    title: 'SDK',
    slug: 'sdk',
    pages: [
      { slug: 'installatie', title: 'Installatie' },
      { slug: 'configuratie', title: 'Configuratie' },
      { slug: 'voorbeelden', title: 'Voorbeelden' },
    ],
  },
  {
    title: 'Beheer',
    slug: 'beheer',
    pages: [
      { slug: 'organisatie-instellingen', title: 'Organisatie-instellingen' },
      { slug: 'billing', title: 'Billing & Abonnementen' },
      { slug: 'api-keys', title: 'API Keys beheren' },
      { slug: 'rollen-permissies', title: 'Rollen & permissies' },
    ],
  },
  {
    title: 'FAQ',
    slug: 'faq',
    pages: [
      { slug: 'veelgestelde-vragen', title: 'Veelgestelde vragen' },
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
