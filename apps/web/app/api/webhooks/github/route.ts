import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPPORTED_EVENTS = [
  'push',
  'pull_request',
  'issues',
  'issue_comment',
  'pull_request_review',
] as const;

type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];

function verifyGitHubSignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('GITHUB_WEBHOOK_SECRET is not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('x-hub-signature-256');
  const eventType = headersList.get('x-github-event');
  const deliveryId = headersList.get('x-github-delivery');

  if (!signature) {
    return NextResponse.json({ error: 'Missing X-Hub-Signature-256 header' }, { status: 400 });
  }

  if (!verifyGitHubSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  if (!eventType) {
    return NextResponse.json({ error: 'Missing X-GitHub-Event header' }, { status: 400 });
  }

  try {
    const payload = JSON.parse(body);

    // Only process supported event types
    if (!SUPPORTED_EVENTS.includes(eventType as SupportedEvent)) {
      console.log(`Ignoring unsupported GitHub event type: ${eventType}`);
      return NextResponse.json({ received: true, ignored: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up connector by GitHub installation or organization
    const installationId = payload.installation?.id;
    const orgLogin = payload.organization?.login || payload.repository?.owner?.login;

    let connectorQuery = supabase
      .from('connectors')
      .select('id, org_id')
      .eq('type', 'github');

    if (installationId) {
      connectorQuery = connectorQuery.eq('config->>installation_id', String(installationId));
    } else if (orgLogin) {
      connectorQuery = connectorQuery.eq('config->>org_login', orgLogin);
    } else {
      console.error('GitHub webhook: no installation or org identifier found');
      return NextResponse.json({ error: 'Cannot identify connector' }, { status: 400 });
    }

    const { data: connector, error: connectorError } = await connectorQuery.single();

    if (connectorError || !connector) {
      console.error('GitHub webhook: connector not found', connectorError);
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    // Store raw event in Supabase
    const { data: rawEvent, error: insertError } = await supabase
      .from('raw_events')
      .insert({
        connector_id: connector.id,
        org_id: connector.org_id,
        event_type: eventType,
        delivery_id: deliveryId,
        payload,
        received_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('GitHub webhook: failed to store raw event', insertError);
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }

    // Queue extraction job
    const { error: jobError } = await supabase
      .from('extraction_jobs')
      .insert({
        raw_event_id: rawEvent.id,
        connector_id: connector.id,
        org_id: connector.org_id,
        event_type: eventType,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (jobError) {
      console.error('GitHub webhook: failed to queue extraction job', jobError);
      // Don't fail the webhook — the raw event is already stored
    }

    return NextResponse.json({ received: true, event_id: rawEvent.id });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
