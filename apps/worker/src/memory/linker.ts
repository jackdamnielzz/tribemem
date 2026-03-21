import type { RawEvent, ConnectorType } from '@tribemem/shared';
import { insertSourceLink } from '../lib/supabase';

// Import connectors for source URL generation
import { SlackConnector } from '../connectors/slack.connector';
import { NotionConnector } from '../connectors/notion.connector';
import { JiraConnector } from '../connectors/jira.connector';
import { GitHubConnector } from '../connectors/github.connector';
import { IntercomConnector } from '../connectors/intercom.connector';
import { LinearConnector } from '../connectors/linear.connector';
import { GoogleDriveConnector } from '../connectors/google-drive.connector';
import { HubSpotConnector } from '../connectors/hubspot.connector';
import { StripeConnector } from '../connectors/stripe.connector';
import type { BaseConnector } from '../connectors/base.connector';

const connectorInstances: Record<string, BaseConnector> = {
  slack: new SlackConnector(),
  notion: new NotionConnector(),
  jira: new JiraConnector(),
  github: new GitHubConnector(),
  intercom: new IntercomConnector(),
  linear: new LinearConnector(),
  google_drive: new GoogleDriveConnector(),
  hubspot: new HubSpotConnector(),
  stripe: new StripeConnector(),
};

/**
 * Link a knowledge unit to its source raw events.
 * Creates source_link records and generates source URLs.
 */
export async function linkKnowledgeToSources(
  knowledgeUnitId: string,
  rawEvents: RawEvent[],
): Promise<void> {
  for (const event of rawEvents) {
    const sourceUrl = getSourceUrl(event.connector_type, event);

    await insertSourceLink({
      knowledge_unit_id: knowledgeUnitId,
      raw_event_id: event.id,
      connector_type: event.connector_type,
      source_url: sourceUrl,
      author_name: event.author_name,
      occurred_at: event.occurred_at,
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Generate a source URL for a raw event based on its connector type.
 */
export function getSourceUrl(
  connectorType: ConnectorType,
  event: RawEvent,
): string | null {
  const connector = connectorInstances[connectorType];
  if (!connector) return null;

  try {
    return connector.getSourceUrl(event);
  } catch {
    return null;
  }
}

/**
 * Batch link multiple knowledge units to their source events.
 */
export async function batchLinkSources(
  links: Array<{
    knowledgeUnitId: string;
    rawEvents: RawEvent[];
  }>,
): Promise<void> {
  for (const link of links) {
    await linkKnowledgeToSources(link.knowledgeUnitId, link.rawEvents);
  }
}
