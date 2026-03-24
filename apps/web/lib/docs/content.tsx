import React from 'react';

/* ─────────────────────────── helpers ─────────────────────────── */

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-4 text-xl font-semibold">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-3 text-lg font-medium">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 ml-6 list-disc space-y-1 text-muted-foreground">{children}</ul>;
}
function OL({ children }: { children: React.ReactNode }) {
  return <ol className="mb-4 ml-6 list-decimal space-y-1 text-muted-foreground">{children}</ol>;
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-background p-4 text-sm">
      <code>{children}</code>
    </pre>
  );
}
function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const colors = {
    info: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-200',
    tip: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
  };
  const labels = { info: 'Info', warning: 'Warning', tip: 'Tip' };
  return (
    <div className={`mb-4 rounded-lg border p-4 ${colors[type]}`}>
      <p className="mb-1 text-sm font-semibold">{labels[type]}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────── GETTING STARTED ──────────────────── */

function Welcome() {
  return (
    <>
      <P>
        TribeMem is an autonomous knowledge crawler platform that continuously monitors your
        team&apos;s communication and documentation tools, automatically extracts organizational
        knowledge, and serves it through a unified query interface.
      </P>
      <H2>What makes TribeMem unique?</H2>
      <UL>
        <li><strong>Not a wiki</strong> — TribeMem stays current automatically without manual maintenance.</li>
        <li><strong>Not document search</strong> — It synthesizes knowledge from behavior and patterns.</li>
        <li><strong>Temporal versioning</strong> — Every fact has a timeline; old versions are superseded, never deleted.</li>
        <li><strong>Source attribution</strong> — Every answer traces back to the original message, ticket, or document.</li>
      </UL>
      <H2>Who is TribeMem for?</H2>
      <UL>
        <li><strong>Team leads &amp; managers</strong> — Accelerate onboarding and reduce repeated questions.</li>
        <li><strong>New employees</strong> — Quickly understand how things really work.</li>
        <li><strong>Consultants &amp; auditors</strong> — Trace decisions and their rationale.</li>
        <li><strong>Developers</strong> — Query via API or MCP for custom tools.</li>
        <li><strong>Ops &amp; support leads</strong> — Identify process drift and knowledge gaps.</li>
      </UL>
      <H2>Next steps</H2>
      <P>
        Create an account and set up your organization to get started. Connect your first
        connector and ask your first question.
      </P>
    </>
  );
}

function CreateAccount() {
  return (
    <>
      <P>
        Creating a TribeMem account takes just a few minutes.
      </P>
      <H2>Steps</H2>
      <OL>
        <li>Go to the registration page via <strong>Sign up</strong> on the login page.</li>
        <li>Enter your email address and a strong password.</li>
        <li>Click <strong>Create account</strong>.</li>
        <li>You will receive a welcome email for confirmation.</li>
        <li>After registration you will be automatically redirected to the onboarding flow.</li>
      </OL>
      <Callout type="tip">
        Use your work email address so teammates can easily recognize you when you invite them.
      </Callout>
      <H2>Forgot your password?</H2>
      <P>
        Click <strong>Forgot password</strong> on the login page. You will receive an email with a link
        to set a new password.
      </P>
    </>
  );
}

function SetUpOrganization() {
  return (
    <>
      <P>
        After creating your account you will be asked to set up an organization. This is the
        workspace where all knowledge, connectors, and team members are managed.
      </P>
      <H2>Create your organization</H2>
      <OL>
        <li>Enter an <strong>organization name</strong> (e.g. &quot;My Company&quot;).</li>
        <li>The <strong>URL slug</strong> is auto-generated but can be customized.</li>
        <li>Optionally add a <strong>description</strong>.</li>
        <li>Click <strong>Create Organization</strong>.</li>
      </OL>
      <P>
        You will automatically be assigned as the <strong>Owner</strong> of the organization with full permissions.
      </P>
      <Callout type="info">
        You can change the organization name and slug later via Settings &gt; General.
      </Callout>
    </>
  );
}

function FirstConnector() {
  return (
    <>
      <P>
        Connectors are the bridges between TribeMem and your existing tools. By connecting a
        connector you give TribeMem access to extract knowledge from your communication and documentation.
      </P>
      <H2>Connect a connector</H2>
      <OL>
        <li>Navigate to <strong>Connectors</strong> in the sidebar.</li>
        <li>Choose the tool you want to connect (e.g. Slack, Notion, GitHub).</li>
        <li>Click <strong>Connect</strong>.</li>
        <li>You will be redirected to the OAuth authorization page of the respective tool.</li>
        <li>Grant TribeMem the requested permissions.</li>
        <li>After authorization you will be redirected back to TribeMem.</li>
      </OL>
      <Callout type="tip">
        Start with the tool where your team communicates most actively (usually Slack or Discord) for the best results.
      </Callout>
      <H2>What happens after connecting?</H2>
      <P>
        TribeMem automatically starts crawling the connected source. The crawler fetches messages,
        documents, and tickets, and the extraction engine processes them into structured knowledge units.
      </P>
    </>
  );
}

function FirstQuery() {
  return (
    <>
      <P>
        Once your first connector is connected and the crawler has processed data, you can start
        asking questions about your organizational knowledge.
      </P>
      <H2>Ask a question</H2>
      <OL>
        <li>Click <strong>Ask</strong> in the sidebar.</li>
        <li>Type your question in natural language, for example: &quot;How does our deployment process work?&quot;</li>
        <li>TribeMem searches the knowledge base and provides a synthesized answer with source references.</li>
      </OL>
      <H2>Tips for effective questions</H2>
      <UL>
        <li>Be specific: &quot;Who is responsible for API design?&quot; works better than &quot;Who does what?&quot;</li>
        <li>Ask about processes: &quot;What are the steps for a code review?&quot;</li>
        <li>Ask about decisions: &quot;Why did we switch to PostgreSQL?&quot;</li>
        <li>Ask about norms: &quot;What are our coding standards for TypeScript?&quot;</li>
      </UL>
      <Callout type="info">
        Every answer includes a confidence score and source references so you can verify where the information comes from.
      </Callout>
    </>
  );
}

/* ──────────────────── CORE CONCEPTS ──────────────────── */

function KnowledgeUnits() {
  return (
    <>
      <P>
        Knowledge units are the building blocks of TribeMem. They are automatically extracted from
        your connected sources and represent discrete pieces of organizational knowledge.
      </P>
      <H2>Five types of knowledge units</H2>
      <Table
        headers={['Type', 'Description', 'Example']}
        rows={[
          ['Facts', 'Verified statements about how things are', '"Our payment processing takes 2-3 days"'],
          ['Processes', 'Step-by-step workflows', '"How to onboard a new developer"'],
          ['Decisions', 'Key choices that were made', '"We chose React over Vue in 2022"'],
          ['Norms', 'Team standards and agreements', '"We require code reviews before every merge"'],
          ['Definitions', 'Domain-specific terms', '"Our definition of done"'],
        ]}
      />
      <H2>Knowledge unit attributes</H2>
      <UL>
        <li><strong>Title</strong> — Short summary of the knowledge.</li>
        <li><strong>Description</strong> — Detailed explanation.</li>
        <li><strong>Type</strong> — One of the five types above.</li>
        <li><strong>Category</strong> — Engineering, support, HR, finance, product, operations, sales, or general.</li>
        <li><strong>Status</strong> — Active, superseded, contradicted, archived, or flagged.</li>
        <li><strong>Confidence score</strong> — Reliability score from 0 to 1.</li>
        <li><strong>Tags</strong> — For filtering and organization.</li>
      </UL>
    </>
  );
}

function ConfidenceScores() {
  return (
    <>
      <P>
        Every knowledge unit in TribeMem has a confidence score that indicates how reliable the
        system considers the information. Scores range from 0 (uncertain) to 1 (highly reliable).
      </P>
      <H2>How are scores calculated?</H2>
      <UL>
        <li><strong>Number of sources</strong> — More independent sources confirming the same thing increase the score.</li>
        <li><strong>Recency</strong> — More recent information carries more weight.</li>
        <li><strong>Consistency</strong> — If sources contradict each other, the score drops.</li>
        <li><strong>Source type</strong> — Official documentation carries more weight than chat messages.</li>
      </UL>
      <H2>Score ranges</H2>
      <Table
        headers={['Score', 'Meaning', 'Action']}
        rows={[
          ['0.8 - 1.0', 'High reliability', 'Safe to use'],
          ['0.5 - 0.8', 'Moderate reliability', 'Verify the sources'],
          ['0.0 - 0.5', 'Low reliability', 'Manually verify'],
        ]}
      />
      <Callout type="info">
        You can set a threshold in your organization settings. Knowledge units below this threshold will be automatically flagged as &quot;stale&quot;.
      </Callout>
    </>
  );
}

function TemporalVersioning() {
  return (
    <>
      <P>
        One of TribeMem&apos;s most powerful features is temporal versioning. Unlike a traditional
        wiki where information is simply overwritten, TribeMem maintains a complete timeline of how
        knowledge evolves.
      </P>
      <H2>How does it work?</H2>
      <UL>
        <li><strong>valid_from / valid_until</strong> — Every fact has a validity period.</li>
        <li><strong>Superseded</strong> — When a fact is replaced by new information, the old fact is marked as &quot;superseded&quot; with a link to its successor.</li>
        <li><strong>Contradicted</strong> — When two sources provide conflicting information, both are flagged.</li>
        <li><strong>Confirmed</strong> — Upon reconfirmation, the &quot;last_confirmed_at&quot; date is updated.</li>
      </UL>
      <H2>Version history</H2>
      <P>
        Every knowledge unit has a complete version history with change types: created, updated,
        superseded, contradicted, confirmed, and archived. This lets you always see when and why
        information was changed.
      </P>
      <H2>Temporal context</H2>
      <Table
        headers={['Context', 'Meaning']}
        rows={[
          ['current', 'Currently valid and up to date'],
          ['historical', 'Was valid but has since been superseded'],
          ['planned', 'Planned but not yet active'],
        ]}
      />
    </>
  );
}

function SourceAttribution() {
  return (
    <>
      <P>
        Every knowledge unit and every answer in TribeMem is traceable to its original source.
        This makes it possible to verify answers and understand their context.
      </P>
      <H2>How does source attribution work?</H2>
      <UL>
        <li>When the crawler fetches data, every message, ticket, or document is stored as a <strong>raw event</strong>.</li>
        <li>During extraction, knowledge units are linked to the sources they were derived from.</li>
        <li>When you ask a question, the answer shows the sources that were used.</li>
      </UL>
      <H2>Source types</H2>
      <Table
        headers={['Source', 'Example']}
        rows={[
          ['Slack message', '#engineering channel, by @john, March 15, 2024'],
          ['Notion page', 'Deployment Guide, last edited Jan 10, 2024'],
          ['Jira ticket', 'PROJ-1234: API redesign'],
          ['GitHub PR', 'PR #456: Migrate to PostgreSQL'],
          ['Google Drive', 'Architecture Document v2.pdf'],
        ]}
      />
      <Callout type="tip">
        Click on a source reference to navigate directly to the original document or message (if the connector supports it).
      </Callout>
    </>
  );
}

/* ──────────────────── FEATURES ──────────────────── */

function Dashboard() {
  return (
    <>
      <P>
        The dashboard gives you an overview of the most important statistics of your organization.
      </P>
      <H2>Statistics</H2>
      <Table
        headers={['Card', 'Description']}
        rows={[
          ['Total Knowledge', 'The total number of knowledge units in your organization'],
          ['Active Connectors', 'Number of actively connected integrations'],
          ['Queries', 'Total number of questions asked'],
          ['Pending Alerts', 'Number of unresolved alerts'],
        ]}
      />
      <H2>Knowledge Growth</H2>
      <P>
        The Knowledge Growth chart shows how your knowledge base grows over time. This helps you
        understand which sources contribute the most.
      </P>
      <H2>Recent Queries</H2>
      <P>
        An overview of the most recent questions asked by team members, including the quality
        of the answers.
      </P>
    </>
  );
}

function AskPage() {
  return (
    <>
      <P>
        The Ask page is the heart of TribeMem. Here you ask questions in natural language and receive
        synthesized answers based on the knowledge from all your connected sources.
      </P>
      <H2>How does it work?</H2>
      <OL>
        <li>Type your question in the input field.</li>
        <li>TribeMem searches all knowledge units using semantic search.</li>
        <li>The synthesize engine combines relevant knowledge into a coherent answer.</li>
        <li>The answer includes source references and a confidence score.</li>
      </OL>
      <H2>Example questions</H2>
      <UL>
        <li>&quot;How does our deployment process work?&quot;</li>
        <li>&quot;Who is responsible for API design?&quot;</li>
        <li>&quot;What are the steps for a code review?&quot;</li>
        <li>&quot;Why did we switch to PostgreSQL?&quot;</li>
        <li>&quot;What are the onboarding steps for new developers?&quot;</li>
        <li>&quot;What coding standards do we use for TypeScript?&quot;</li>
      </UL>
      <Callout type="tip">
        Ask specific questions for better results. &quot;How do I deploy to production?&quot; gives a more precise answer than &quot;Tell me about deployments&quot;.
      </Callout>
      <H2>Query limits</H2>
      <P>
        The number of queries per month depends on your subscription plan. Check your current usage
        on the Billing page under Settings.
      </P>
    </>
  );
}

function KnowledgeBase() {
  return (
    <>
      <P>
        The Knowledge Base contains all extracted knowledge, divided into four categories accessible
        via the sidebar.
      </P>
      <H2>Navigation</H2>
      <Table
        headers={['Tab', 'Content']}
        rows={[
          ['Facts', 'Verified facts about your organization'],
          ['Processes', 'Documented workflows and processes'],
          ['Decisions', 'Key decisions with rationale'],
          ['Norms', 'Team standards, agreements, and best practices'],
        ]}
      />
      <H2>Filtering and searching</H2>
      <UL>
        <li><strong>Category</strong> — Filter by engineering, support, HR, finance, etc.</li>
        <li><strong>Status</strong> — Filter by active, superseded, contradicted, archived, or flagged.</li>
        <li><strong>Confidence</strong> — Filter by reliability score.</li>
        <li><strong>Tags</strong> — Filter by assigned tags.</li>
        <li><strong>Search</strong> — Search by keywords in title and description.</li>
      </UL>
      <H2>Editing a knowledge unit</H2>
      <P>
        Click on a knowledge unit to view its details. Depending on your role you can edit the title,
        description, tags, and status.
      </P>
    </>
  );
}

function ConnectorsPage() {
  return (
    <>
      <P>
        Connectors link TribeMem to your existing tools. From the Connectors page you can connect
        new integrations and manage existing ones.
      </P>
      <H2>Available connectors</H2>
      <P>
        TribeMem currently supports integrations with Slack, Notion, Jira, GitHub, Linear, Discord,
        Google Drive, HubSpot, and Freshdesk. Confluence, Intercom, and Stripe are coming soon.
      </P>
      <H2>Connecting a connector</H2>
      <OL>
        <li>Go to <strong>Connectors</strong> in the sidebar.</li>
        <li>Find the desired tool.</li>
        <li>Click <strong>Connect</strong>.</li>
        <li>Complete the OAuth authorization process.</li>
        <li>The connector will appear as &quot;Connected&quot; after successful linking.</li>
      </OL>
      <H2>Disconnecting a connector</H2>
      <P>
        Click <strong>Revoke</strong> on a connected connector to disconnect it. Existing knowledge
        extracted via this connector will be preserved.
      </P>
      <Callout type="warning">
        Disconnecting a connector stops crawling new data but does not remove existing knowledge.
      </Callout>
    </>
  );
}

function CrawlerPage() {
  return (
    <>
      <P>
        The Crawler is the component that periodically scans your connected sources and fetches new data.
      </P>
      <H2>Automatic crawling</H2>
      <P>
        When auto-crawl is enabled (default), TribeMem automatically fetches new data from your
        connectors at regular intervals. You can configure this in Settings &gt; General.
      </P>
      <H2>Manual crawling</H2>
      <OL>
        <li>Go to the <strong>Crawler</strong> page.</li>
        <li>Click <strong>Start Crawl</strong> to manually trigger a crawl run.</li>
        <li>Progress is shown in real time.</li>
      </OL>
      <H2>Viewing crawl runs</H2>
      <P>
        On the Crawler page you can see an overview of all previous crawl runs, including status,
        start time, duration, and the number of processed events.
      </P>
      <H2>Extraction</H2>
      <P>
        After crawling, the fetched events are automatically processed by the extraction engine.
        It uses AI to extract structured knowledge units from unstructured data such as chat messages,
        tickets, and documents.
      </P>
    </>
  );
}

function AlertsPage() {
  return (
    <>
      <P>
        The alerts system notifies you about important events in your knowledge base, such as
        contradictions, process drift, and stale knowledge.
      </P>
      <H2>Alert types</H2>
      <Table
        headers={['Type', 'Description']}
        rows={[
          ['Contradiction', 'Two or more sources contradict each other'],
          ['Process Drift', 'A described process differs from actual practice'],
          ['Knowledge Gap', 'A gap in knowledge has been detected'],
          ['Stale Knowledge', 'Knowledge has not been confirmed or updated for a long time'],
          ['Connector Error', 'There is a problem with a connected connector'],
          ['Usage Limit', 'You are approaching or exceeding a usage limit'],
        ]}
      />
      <H2>Severity levels</H2>
      <Table
        headers={['Level', 'Meaning']}
        rows={[
          ['Critical', 'Immediate action required'],
          ['High', 'Resolve as soon as possible'],
          ['Medium', 'Needs attention in the short term'],
          ['Low', 'Review when convenient'],
          ['Info', 'For informational purposes'],
        ]}
      />
      <H2>Managing alerts</H2>
      <UL>
        <li>Click the bell icon in the top right to view recent alerts.</li>
        <li>Click on an alert to mark it as read.</li>
        <li>Go to the Alerts page for a full overview.</li>
        <li>Mark alerts as resolved once you have taken action.</li>
      </UL>
    </>
  );
}

function TeamManagement() {
  return (
    <>
      <P>
        From the Team page you manage the members of your organization. You can invite new members,
        assign roles, and remove members.
      </P>
      <H2>Viewing team members</H2>
      <P>
        The Team page shows an overview of all members with their name, email address, role, and
        date added.
      </P>
      <H2>Inviting a member</H2>
      <OL>
        <li>Click <strong>Invite Member</strong>.</li>
        <li>Enter the email address of the person you want to invite.</li>
        <li>Select the desired role (Member or Admin).</li>
        <li>Click <strong>Send Invite</strong>.</li>
      </OL>
      <H2>Changing roles</H2>
      <P>
        As an Owner or Admin you can change the role of other members via the dropdown menu next to
        their name. See &quot;Roles &amp; permissions&quot; for an explanation of each role.
      </P>
      <H2>Removing a member</H2>
      <P>
        Click <strong>Remove</strong> next to the member you want to remove. This action cannot be undone.
      </P>
      <Callout type="warning">
        Removing a member does not delete their account. They only lose access to the organization.
      </Callout>
    </>
  );
}

/* ──────────────────── INTEGRATIONS ──────────────────── */

function IntegrationPage({
  name,
  description,
  whatIsCrawled,
  permissions,
  setupSteps,
  authMethod = 'OAuth 2.0',
}: {
  name: string;
  description: string;
  whatIsCrawled: string[];
  permissions: string[];
  setupSteps: string[];
  authMethod?: string;
}) {
  return (
    <>
      <P>{description}</P>
      <H2>What is crawled?</H2>
      <UL>
        {whatIsCrawled.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </UL>
      <H2>Required permissions</H2>
      <UL>
        {permissions.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </UL>
      <H2>Setup</H2>
      <P>
        <strong>Authentication method:</strong> {authMethod}
      </P>
      <OL>
        {setupSteps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </OL>
      <Callout type="tip">
        After connecting, the crawler will automatically start fetching data from {name}.
      </Callout>
    </>
  );
}

function SlackIntegration() {
  return (
    <IntegrationPage
      name="Slack"
      description="Connect Slack to extract knowledge from your team's daily communication. TribeMem reads messages from public and authorized private channels."
      whatIsCrawled={[
        'Messages in public channels',
        'Messages in authorized private channels',
        'Thread replies',
        'Shared files and links',
        'Channel information and descriptions',
      ]}
      permissions={[
        'channels:read — View list of channels',
        'channels:history — Read messages in public channels',
        'groups:read — View private channels',
        'groups:history — Read messages in private channels',
        'users:read — Fetch user information',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to Slack.',
        'You will be redirected to Slack for authorization.',
        'Select the workspace you want to connect.',
        'Grant TribeMem the requested permissions.',
        'You will be redirected back to TribeMem.',
      ]}
    />
  );
}

function NotionIntegration() {
  return (
    <IntegrationPage
      name="Notion"
      description="Connect Notion to extract knowledge from your wikis, databases, and documentation."
      whatIsCrawled={[
        'Page content and subpages',
        'Database entries',
        'Comments on pages',
        'Page metadata (author, creation date, tags)',
      ]}
      permissions={[
        'Read content — Read page content',
        'Read user info — Fetch user information',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to Notion.',
        'You will be redirected to Notion for authorization.',
        'Select which pages and databases to share with TribeMem.',
        'Click Allow access.',
        'You will be redirected back to TribeMem.',
      ]}
    />
  );
}

function JiraIntegration() {
  return (
    <IntegrationPage
      name="Jira"
      description="Connect Jira to extract knowledge from your project management, including tickets, sprints, and decisions."
      whatIsCrawled={[
        'Issues and subtasks',
        'Comments on issues',
        'Sprint information',
        'Project metadata',
        'Status changes and workflows',
      ]}
      permissions={[
        'read:jira-work — Read issues and projects',
        'read:jira-user — Fetch user information',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to Jira.',
        'You will be redirected to Atlassian for authorization.',
        'Select the Jira site you want to connect.',
        'Grant TribeMem read access.',
        'You will be redirected back to TribeMem.',
      ]}
    />
  );
}

function GitHubIntegration() {
  return (
    <IntegrationPage
      name="GitHub"
      description="Connect GitHub to extract knowledge from pull requests, issues, discussions, and code reviews."
      whatIsCrawled={[
        'Pull requests and reviews',
        'Issues and comments',
        'Discussions',
        'Repository metadata',
        'README and documentation files',
      ]}
      permissions={[
        'repo — Access to repositories',
        'read:org — Read organization information',
        'read:user — Fetch user information',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to GitHub.',
        'You will be redirected to GitHub for authorization.',
        'Select which repositories you want to connect.',
        'Grant TribeMem the requested permissions.',
        'You will be redirected back to TribeMem.',
      ]}
    />
  );
}

function LinearIntegration() {
  return (
    <IntegrationPage
      name="Linear"
      description="Connect Linear to extract knowledge from your project management, including issues, cycles, and roadmaps."
      whatIsCrawled={[
        'Issues and sub-issues',
        'Comments',
        'Cycles and projects',
        'Labels and statuses',
        'Team information',
      ]}
      permissions={[
        'read — Read access to workspace data',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to Linear.',
        'You will be redirected to Linear for authorization.',
        'Grant TribeMem read access to your workspace.',
        'You will be redirected back to TribeMem.',
      ]}
    />
  );
}

function DiscordIntegration() {
  return (
    <IntegrationPage
      name="Discord"
      description="Connect Discord to extract knowledge from server messages and discussions."
      whatIsCrawled={[
        'Messages in text channels',
        'Thread messages',
        'Channel information',
        'Server information',
      ]}
      permissions={[
        'Bot permissions — Read messages in authorized channels',
        'Read Message History — View message history',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to Discord.',
        'You will be redirected to Discord for authorization.',
        'Select the server you want to connect.',
        'Grant the TribeMem bot the requested permissions.',
        'You will be redirected back to TribeMem.',
      ]}
    />
  );
}

function GoogleDriveIntegration() {
  return (
    <IntegrationPage
      name="Google Drive"
      description="Connect Google Drive to extract knowledge from documents, spreadsheets, and presentations."
      whatIsCrawled={[
        'Google Docs content',
        'Google Sheets data',
        'Google Slides content',
        'PDF files (text)',
        'File metadata and folder structure',
      ]}
      permissions={[
        'drive.readonly — Read access to Drive files',
        'userinfo.email — Email address for identification',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to Google Drive.',
        'You will be redirected to Google for authorization.',
        'Select the account you want to connect.',
        'Grant TribeMem read access to your files.',
        'You will be redirected back to TribeMem.',
      ]}
    />
  );
}

function HubSpotIntegration() {
  return (
    <IntegrationPage
      name="HubSpot"
      description="Connect HubSpot to extract knowledge from your CRM, including contacts, deals, and notes."
      whatIsCrawled={[
        'Contacts and companies',
        'Deals and pipelines',
        'Notes and activities',
        'Email communication (summaries)',
        'Ticket information',
      ]}
      permissions={[
        'crm.objects.contacts.read — Read contacts',
        'crm.objects.deals.read — Read deals',
        'crm.objects.companies.read — Read companies',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to HubSpot.',
        'You will be redirected to HubSpot for authorization.',
        'Select the HubSpot account you want to connect.',
        'Grant TribeMem the requested permissions.',
        'You will be redirected back to TribeMem.',
      ]}
    />
  );
}

function FreshdeskIntegration() {
  return (
    <IntegrationPage
      name="Freshdesk"
      description="Connect Freshdesk to extract knowledge from your customer service tickets and knowledge base."
      whatIsCrawled={[
        'Support tickets and replies',
        'Knowledge base articles',
        'Contact information',
        'Ticket categories and tags',
      ]}
      permissions={[
        'API key with read access to tickets and knowledge base',
      ]}
      setupSteps={[
        'Go to Connectors and click Connect next to Freshdesk.',
        'Enter your Freshdesk domain (e.g. mycompany.freshdesk.com).',
        'Enter your Freshdesk API key (found in Profile Settings > API Key).',
        'Click Connect.',
      ]}
      authMethod="API Key"
    />
  );
}

/* ──────────────────── API ──────────────────── */

function ApiAuthentication() {
  return (
    <>
      <P>
        The TribeMem API uses API keys for authentication. All requests must include a valid API key
        in the Authorization header.
      </P>
      <H2>Creating an API key</H2>
      <OL>
        <li>Go to <strong>API Keys</strong> in the sidebar (under Settings).</li>
        <li>Click <strong>Create API Key</strong>.</li>
        <li>Give the key a descriptive name.</li>
        <li>Select the desired scopes (permissions).</li>
        <li>Click <strong>Create</strong>.</li>
        <li>Copy the key immediately — it is only shown once.</li>
      </OL>
      <H2>Authentication</H2>
      <P>Add the API key to every request via the Authorization header:</P>
      <Code>{`curl -H "Authorization: Bearer tm_your_api_key_here" \\
  https://app.tribemem.com/api/v1/knowledge`}</Code>
      <H2>Available scopes</H2>
      <Table
        headers={['Scope', 'Description']}
        rows={[
          ['query:read', 'Search the knowledge base'],
          ['knowledge:read', 'Retrieve knowledge units'],
          ['knowledge:write', 'Create and edit knowledge units'],
          ['connectors:read', 'View connectors'],
          ['connectors:write', 'Manage connectors'],
          ['members:read', 'View team members'],
          ['members:write', 'Manage team members'],
          ['alerts:read', 'View alerts'],
          ['alerts:write', 'Manage alerts'],
          ['billing:read', 'View billing information'],
          ['billing:write', 'Manage billing'],
        ]}
      />
    </>
  );
}

function KnowledgeEndpoints() {
  return (
    <>
      <H2>Query — Ask a question</H2>
      <Code>{`POST /api/v1/query
Content-Type: application/json

{
  "query": "How does our deployment process work?"
}`}</Code>
      <P>Returns a synthesized answer with source references and confidence score.</P>

      <H2>List knowledge units</H2>
      <Code>{`GET /api/v1/knowledge
GET /api/v1/knowledge?type=process&category=engineering&status=active
GET /api/v1/knowledge?page=1&limit=20`}</Code>
      <P>Supports filtering by type, category, status, and pagination.</P>

      <H2>Get a single knowledge unit</H2>
      <Code>{`GET /api/v1/knowledge/:id`}</Code>

      <H2>Create a knowledge unit</H2>
      <Code>{`POST /api/v1/knowledge
Content-Type: application/json

{
  "title": "Deployment process",
  "content": "We deploy every Tuesday via CI/CD...",
  "type": "process",
  "category": "engineering",
  "tags": ["deployment", "ci-cd"]
}`}</Code>

      <H2>Update a knowledge unit</H2>
      <Code>{`PATCH /api/v1/knowledge/:id
Content-Type: application/json

{
  "title": "Updated title",
  "content": "Updated content..."
}`}</Code>

      <H2>Delete a knowledge unit</H2>
      <Code>{`DELETE /api/v1/knowledge/:id`}</Code>
      <Callout type="warning">
        Deletion is permanent. Consider changing the status to &quot;archived&quot; as an alternative.
      </Callout>
    </>
  );
}

function AlertsEndpoints() {
  return (
    <>
      <H2>List all alerts</H2>
      <Code>{`GET /api/v1/alerts`}</Code>
      <P>Returns all alerts for your organization, sorted by creation date (newest first).</P>

      <H2>Update an alert</H2>
      <Code>{`PATCH /api/v1/alerts/:id
Content-Type: application/json

{
  "is_read": true,
  "is_resolved": true
}`}</Code>

      <H2>Response example</H2>
      <Code>{`{
  "alerts": [
    {
      "id": "uuid",
      "type": "contradiction",
      "severity": "high",
      "title": "Conflicting information about deployment day",
      "description": "Source A says Tuesday, source B says Thursday",
      "is_read": false,
      "is_resolved": false,
      "created_at": "2024-03-15T10:30:00Z"
    }
  ],
  "total": 1
}`}</Code>
    </>
  );
}

function ConnectorsEndpoints() {
  return (
    <>
      <H2>List all connectors</H2>
      <Code>{`GET /api/v1/connectors`}</Code>
      <P>Returns all connectors for your organization with their status.</P>

      <H2>Connect a connector (OAuth)</H2>
      <Code>{`POST /api/v1/connectors/:type/connect`}</Code>
      <P>
        Starts the OAuth authorization process. Returns a redirect URL where the user should be sent.
        Supported types: slack, notion, jira, github, linear, discord, google-drive, hubspot.
      </P>

      <H2>OAuth callback</H2>
      <Code>{`GET /api/v1/connectors/:type/callback?code=...&state=...`}</Code>
      <P>
        This endpoint is automatically called by the OAuth provider after authorization.
        It stores the credentials securely (AES-256-GCM encrypted).
      </P>

      <H2>Response example</H2>
      <Code>{`{
  "connectors": [
    {
      "id": "uuid",
      "type": "slack",
      "status": "connected",
      "connected_at": "2024-03-01T09:00:00Z",
      "last_crawled_at": "2024-03-15T14:30:00Z"
    }
  ]
}`}</Code>
    </>
  );
}

function TeamBillingEndpoints() {
  return (
    <>
      <H2>List team members</H2>
      <Code>{`GET /api/v1/members`}</Code>
      <P>Returns all members of your organization with their role and date added.</P>

      <H2>Get billing information</H2>
      <Code>{`GET /api/billing`}</Code>
      <P>Returns the current subscription, usage, and plan details.</P>

      <H2>Create a subscription</H2>
      <Code>{`POST /api/billing
Content-Type: application/json

{
  "plan": "starter"
}`}</Code>
      <P>Starts a Stripe Checkout session for the chosen plan.</P>

      <H2>Change plan</H2>
      <Code>{`PUT /api/billing
Content-Type: application/json

{
  "plan": "growth"
}`}</Code>

      <H2>Cancel subscription</H2>
      <Code>{`DELETE /api/billing`}</Code>
      <Callout type="warning">
        After cancellation you retain access until the end of the current billing period, after which
        you will be downgraded to the Free plan.
      </Callout>
    </>
  );
}

function RateLimits() {
  return (
    <>
      <P>
        The TribeMem API enforces rate limits to ensure fair usage. Limits depend on your
        subscription plan.
      </P>
      <H2>Rate limits per plan</H2>
      <Table
        headers={['Plan', 'Requests/minute', 'Queries/month']}
        rows={[
          ['Free', '30', '50'],
          ['Starter', '60', '500'],
          ['Growth', '120', '2,000'],
          ['Business', '300', '10,000'],
          ['Enterprise', 'Custom', 'Unlimited'],
        ]}
      />
      <H2>Rate limit headers</H2>
      <P>Every response includes headers showing your current usage:</P>
      <Code>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1710500000`}</Code>
      <H2>Error codes</H2>
      <Table
        headers={['Code', 'Meaning', 'Solution']}
        rows={[
          ['400', 'Bad Request — Invalid request', 'Check your request body and parameters'],
          ['401', 'Unauthorized — Invalid or missing API key', 'Check your Authorization header'],
          ['403', 'Forbidden — Insufficient permissions', 'Check the scopes of your API key'],
          ['404', 'Not Found — Resource not found', 'Check the ID or path'],
          ['429', 'Too Many Requests — Rate limit reached', 'Wait and try again'],
          ['500', 'Internal Server Error', 'Try again or contact support'],
        ]}
      />
    </>
  );
}

/* ──────────────────── MCP ──────────────────── */

function WhatIsMcp() {
  return (
    <>
      <P>
        MCP (Model Context Protocol) is an open standard that enables AI assistants to communicate
        with external tools and data sources. TribeMem provides an MCP server that makes your
        organizational knowledge directly available in AI tools like Claude Desktop, Claude Code, and Cursor.
      </P>
      <H2>Why MCP?</H2>
      <UL>
        <li>Ask questions about your organizational knowledge from your favorite AI tool.</li>
        <li>No more context-switching between TribeMem and your work tools.</li>
        <li>AI assistants get direct access to up-to-date organizational knowledge.</li>
        <li>Build custom workflows that automatically fetch relevant knowledge.</li>
      </UL>
      <H2>Supported tools</H2>
      <UL>
        <li>Claude Desktop</li>
        <li>Claude Code (CLI)</li>
        <li>Cursor</li>
        <li>Any MCP-compatible client</li>
      </UL>
    </>
  );
}

function McpSetup() {
  return (
    <>
      <P>
        Follow these steps to configure the TribeMem MCP server in your AI tool.
      </P>
      <H2>Requirements</H2>
      <UL>
        <li>Node.js 18 or higher</li>
        <li>A TribeMem API key with <code className="rounded bg-muted px-1 text-sm">query:read</code> scope</li>
      </UL>
      <H2>Configuration for Claude Desktop</H2>
      <P>Add the following to your Claude Desktop configuration:</P>
      <Code>{`{
  "mcpServers": {
    "tribemem": {
      "command": "npx",
      "args": [
        "@tribemem/mcp-server",
        "--api-key",
        "tm_your_api_key_here"
      ]
    }
  }
}`}</Code>
      <H2>Configuration for Claude Code</H2>
      <Code>{`claude mcp add tribemem -- npx @tribemem/mcp-server --api-key tm_your_api_key_here`}</Code>
      <H2>Verification</H2>
      <P>
        After configuration you can ask questions in your AI tool like &quot;Search TribeMem for how
        our deployment process works&quot; and the tool will automatically call the MCP server.
      </P>
    </>
  );
}

function McpTools() {
  return (
    <>
      <P>
        The TribeMem MCP server provides four tools that AI assistants can use.
      </P>
      <H2>query_knowledge</H2>
      <P>Search the knowledge base with a natural language query.</P>
      <Code>{`Tool: query_knowledge
Input: { "query": "How does our deployment process work?" }
Output: Structured answer with confidence score`}</Code>

      <H2>get_process</H2>
      <P>Retrieve a specific process with all its steps.</P>
      <Code>{`Tool: get_process
Input: { "name": "code-review" }
Output: Steps, responsible parties, edge cases`}</Code>

      <H2>list_recent_decisions</H2>
      <P>View recent organizational decisions.</P>
      <Code>{`Tool: list_recent_decisions
Input: { "category": "engineering" }  // optional
Output: List of decisions with context and rationale`}</Code>

      <H2>get_context</H2>
      <P>Get contextual information about a topic.</P>
      <Code>{`Tool: get_context
Input: { "topic": "PostgreSQL migration" }
Output: Related entities, history, confidence`}</Code>
    </>
  );
}

/* ──────────────────── SDK ──────────────────── */

function SdkInstallation() {
  return (
    <>
      <P>
        The TribeMem SDK provides a typed TypeScript client library for integrating TribeMem
        into your own applications.
      </P>
      <H2>Installation</H2>
      <Code>{`npm install @tribemem/sdk
# or
yarn add @tribemem/sdk
# or
pnpm add @tribemem/sdk`}</Code>
      <H2>Requirements</H2>
      <UL>
        <li>Node.js 18 or higher</li>
        <li>TypeScript 5.0+ (recommended but not required)</li>
        <li>A TribeMem API key</li>
      </UL>
    </>
  );
}

function SdkConfiguration() {
  return (
    <>
      <H2>Initialize the client</H2>
      <Code>{`import { TribeMemClient } from '@tribemem/sdk';

const client = new TribeMemClient({
  apiKey: 'tm_your_api_key_here',
  // optional: custom base URL
  // baseUrl: 'https://app.tribemem.com'
});`}</Code>
      <H2>Environment variables</H2>
      <P>
        It is recommended to set your API key as an environment variable instead of hardcoding it
        in your code:
      </P>
      <Code>{`// .env
TRIBEMEM_API_KEY=tm_your_api_key_here

// In your code
const client = new TribeMemClient({
  apiKey: process.env.TRIBEMEM_API_KEY!,
});`}</Code>
      <H2>TypeScript support</H2>
      <P>
        The SDK is fully written in TypeScript and includes type definitions for all endpoints,
        request and response objects. Your IDE will provide auto-completion and type checking.
      </P>
    </>
  );
}

function SdkExamples() {
  return (
    <>
      <H2>Query knowledge</H2>
      <Code>{`const result = await client.query('How does our deployment process work?');
console.log(result.answer);
console.log(result.confidence);
console.log(result.sources);`}</Code>

      <H2>List knowledge units</H2>
      <Code>{`// Get all processes
const { items, total } = await client.knowledge.list({
  type: 'process',
  category: 'engineering',
  status: 'active',
  page: 1,
  limit: 20,
});

// Get a single knowledge unit
const item = await client.knowledge.get('knowledge-unit-id');`}</Code>

      <H2>Create a knowledge unit</H2>
      <Code>{`const newItem = await client.knowledge.create({
  title: 'Release procedure',
  content: 'We release every Tuesday via CI/CD pipeline...',
  type: 'process',
  category: 'engineering',
  tags: ['release', 'ci-cd'],
});`}</Code>

      <H2>Manage alerts</H2>
      <Code>{`const { alerts } = await client.alerts.list();

// Mark alert as read
await client.alerts.update('alert-id', { is_read: true });

// Mark alert as resolved
await client.alerts.update('alert-id', { is_resolved: true });`}</Code>

      <H2>List connectors</H2>
      <Code>{`const { connectors } = await client.connectors.list();
connectors.forEach(c => {
  console.log(\`\${c.type}: \${c.status}\`);
});`}</Code>
    </>
  );
}

/* ──────────────────── ADMINISTRATION ──────────────────── */

function OrganizationSettings() {
  return (
    <>
      <P>
        Via Settings &gt; General you can manage the basic settings of your organization.
      </P>
      <H2>General settings</H2>
      <UL>
        <li><strong>Organization name</strong> — The display name of your organization.</li>
        <li><strong>URL slug</strong> — Used in URLs and API calls.</li>
      </UL>
      <H2>Crawler settings</H2>
      <UL>
        <li><strong>Auto-crawl</strong> — Enable or disable automatic crawling.</li>
        <li><strong>Conflict detection</strong> — Automatically detect conflicting information.</li>
        <li><strong>Staleness alerts</strong> — Receive alerts when knowledge becomes stale.</li>
        <li><strong>Confidence threshold (%)</strong> — Knowledge below this threshold is flagged as unreliable.</li>
      </UL>
      <H2>Danger Zone</H2>
      <Callout type="warning">
        In the Danger Zone you can delete your entire organization. This is irreversible and removes
        all knowledge, connectors, members, and settings.
      </Callout>
    </>
  );
}

function BillingPage() {
  return (
    <>
      <P>
        Via Settings &gt; Billing you manage your subscription, view your usage, and manage your invoices.
      </P>
      <H2>Subscription plans</H2>
      <Table
        headers={['Plan', 'Price', 'Connectors', 'Knowledge', 'Queries/mo', 'Members']}
        rows={[
          ['Free', 'Free', '1', '500', '50', '3'],
          ['Starter', '$49/mo', '3', '5,000', '500', '10'],
          ['Growth', '$149/mo', '8', '25,000', '2,000', '50'],
          ['Business', '$399/mo', 'Unlimited', 'Unlimited', '10,000', '200'],
          ['Enterprise', 'Custom', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'],
        ]}
      />
      <H2>Viewing usage</H2>
      <P>
        On the Billing page you can see your current usage for the current billing period:
        knowledge units, connectors, queries, and team members.
      </P>
      <H2>Upgrading or downgrading</H2>
      <P>
        Click <strong>Upgrade</strong> or <strong>Downgrade</strong> to switch plans. When upgrading
        you get immediate access to the additional features. When downgrading you retain access
        until the end of the current period.
      </P>
      <H2>Cancellation</H2>
      <P>
        Click <strong>Cancel Subscription</strong> to cancel your subscription. You retain access
        until the end of the current billing period.
      </P>
    </>
  );
}

function ApiKeysPage() {
  return (
    <>
      <P>
        API Keys provide programmatic access to the TribeMem API. Manage your keys via API Keys in the sidebar.
      </P>
      <H2>Creating an API key</H2>
      <OL>
        <li>Click <strong>Create API Key</strong>.</li>
        <li>Give the key a descriptive name (e.g. &quot;Production API&quot;).</li>
        <li>Select the desired scopes.</li>
        <li>Click <strong>Create</strong>.</li>
        <li>Copy the key immediately — it is only shown once.</li>
      </OL>
      <Callout type="warning">
        Store your API key securely. Never share it in public repositories or chat messages.
        If you suspect a key has been leaked, revoke it immediately.
      </Callout>
      <H2>Managing keys</H2>
      <UL>
        <li><strong>Status</strong> — View whether a key is active or inactive.</li>
        <li><strong>Last used</strong> — See when a key was last used.</li>
        <li><strong>Revoke</strong> — Click <strong>Delete</strong> to permanently revoke a key.</li>
      </UL>
    </>
  );
}

function RolesPermissions() {
  return (
    <>
      <P>
        TribeMem has four roles with escalating permissions.
      </P>
      <H2>Roles matrix</H2>
      <Table
        headers={['Action', 'Viewer', 'Member', 'Admin', 'Owner']}
        rows={[
          ['View knowledge', 'Yes', 'Yes', 'Yes', 'Yes'],
          ['Ask questions', 'No', 'Yes', 'Yes', 'Yes'],
          ['Edit knowledge', 'No', 'Limited', 'Yes', 'Yes'],
          ['Manage connectors', 'No', 'No', 'Yes', 'Yes'],
          ['Manage team', 'No', 'No', 'Yes', 'Yes'],
          ['Change settings', 'No', 'No', 'Yes', 'Yes'],
          ['Manage billing', 'No', 'No', 'No', 'Yes'],
          ['Delete organization', 'No', 'No', 'No', 'Yes'],
        ]}
      />
      <H2>Role descriptions</H2>
      <UL>
        <li><strong>Owner</strong> — Full control over the organization. Can delete the organization and is the primary billing contact.</li>
        <li><strong>Admin</strong> — Can manage the team, connectors, and settings. Cannot manage billing or delete the organization.</li>
        <li><strong>Member</strong> — Can view and search knowledge, with limited editing capabilities.</li>
        <li><strong>Viewer</strong> — Read-only access to the knowledge base. Cannot ask questions or make changes.</li>
      </UL>
    </>
  );
}

/* ──────────────────── FAQ ──────────────────── */

function FaqPage() {
  return (
    <>
      <H3>How often is knowledge updated?</H3>
      <P>
        The crawler runs automatically at regular intervals (configurable in Settings).
        Additionally, you can manually start a crawl via the Crawler page. New knowledge is
        typically available within minutes after crawling.
      </P>

      <H3>What happens when sources contradict each other?</H3>
      <P>
        TribeMem automatically detects contradictions and marks both knowledge units as
        &quot;contradicted&quot;. You will receive an alert so you can investigate and resolve
        the contradiction.
      </P>

      <H3>How secure is my data?</H3>
      <P>
        All connector credentials are stored encrypted with AES-256-GCM. Data is stored in
        Supabase (PostgreSQL) with Row Level Security (RLS). API keys are hashed and never
        stored in plaintext after creation.
      </P>

      <H3>Can I manually add or edit knowledge?</H3>
      <P>
        Yes. Via the Knowledge Base you can edit existing knowledge units, and via the API you can
        create new knowledge units. This is useful for knowledge that is not in your connected tools.
      </P>

      <H3>What counts as a &quot;query&quot; for my limit?</H3>
      <P>
        Every question you ask via the Ask page, the API (POST /api/v1/query), or the MCP server
        counts as one query. Browsing the Knowledge Base does not count.
      </P>

      <H3>Can I have multiple organizations?</H3>
      <P>
        Currently TribeMem supports one organization per account. If you need multiple
        organizations, please contact us about the Enterprise plan.
      </P>

      <H3>What languages are supported?</H3>
      <P>
        TribeMem supports all languages supported by the underlying AI models. Knowledge is
        extracted and answered in the language of the source. You can ask questions in any language.
      </P>

      <H3>How can I reach support?</H3>
      <UL>
        <li><strong>Free plan:</strong> Email support</li>
        <li><strong>Starter plan:</strong> Priority email support</li>
        <li><strong>Growth plan:</strong> Chat support</li>
        <li><strong>Business plan:</strong> Dedicated account manager</li>
        <li><strong>Enterprise plan:</strong> 24/7 support with SLA</li>
      </UL>
    </>
  );
}

/* ──────────────────── CONTENT MAP ──────────────────── */

export const docsContent: Record<string, Record<string, React.ComponentType>> = {
  'getting-started': {
    welcome: Welcome,
    'create-account': CreateAccount,
    'set-up-organization': SetUpOrganization,
    'first-connector': FirstConnector,
    'first-query': FirstQuery,
  },
  'core-concepts': {
    'knowledge-units': KnowledgeUnits,
    'confidence-scores': ConfidenceScores,
    'temporal-versioning': TemporalVersioning,
    'source-attribution': SourceAttribution,
  },
  features: {
    dashboard: Dashboard,
    ask: AskPage,
    'knowledge-base': KnowledgeBase,
    connectors: ConnectorsPage,
    crawler: CrawlerPage,
    alerts: AlertsPage,
    'team-management': TeamManagement,
  },
  integrations: {
    slack: SlackIntegration,
    notion: NotionIntegration,
    jira: JiraIntegration,
    github: GitHubIntegration,
    linear: LinearIntegration,
    discord: DiscordIntegration,
    'google-drive': GoogleDriveIntegration,
    hubspot: HubSpotIntegration,
    freshdesk: FreshdeskIntegration,
  },
  api: {
    authentication: ApiAuthentication,
    'knowledge-endpoints': KnowledgeEndpoints,
    'alerts-endpoints': AlertsEndpoints,
    'connectors-endpoints': ConnectorsEndpoints,
    'team-billing-endpoints': TeamBillingEndpoints,
    'rate-limits': RateLimits,
  },
  mcp: {
    'what-is-mcp': WhatIsMcp,
    setup: McpSetup,
    'available-tools': McpTools,
  },
  sdk: {
    installation: SdkInstallation,
    configuration: SdkConfiguration,
    examples: SdkExamples,
  },
  administration: {
    'organization-settings': OrganizationSettings,
    billing: BillingPage,
    'api-keys': ApiKeysPage,
    'roles-permissions': RolesPermissions,
  },
  faq: {
    'frequently-asked-questions': FaqPage,
  },
};
