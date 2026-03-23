'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ConnectorCard } from '@/components/connectors/connector-card';
import { useOrg } from '@/hooks/use-org';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'next/navigation';

interface ConnectorRecord {
  id: string;
  type: string;
  status: string;
  display_name: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  events_processed: number;
}

// All available connectors with their display info
const ALL_CONNECTORS: {
  type: string;
  name: string;
  description: string;
  color: string;
  oauthKey: string | null; // null = no OAuth provider (api_key or not implemented)
  comingSoon?: boolean;
}[] = [
  { type: 'slack', name: 'Slack', description: 'Chat messages, threads, and channels', color: 'bg-[#4A154B]', oauthKey: 'slack' },
  { type: 'notion', name: 'Notion', description: 'Pages, databases, and wikis', color: 'bg-[#191919]', oauthKey: 'notion' },
  { type: 'jira', name: 'Jira', description: 'Issues, epics, and project boards', color: 'bg-[#0052CC]', oauthKey: 'jira' },
  { type: 'github', name: 'GitHub', description: 'Repositories, PRs, and discussions', color: 'bg-[#24292F]', oauthKey: 'github' },
  { type: 'linear', name: 'Linear', description: 'Issues, projects, and roadmaps', color: 'bg-[#5E6AD2]', oauthKey: 'linear' },
  { type: 'google_drive', name: 'Google Drive', description: 'Documents, sheets, and presentations', color: 'bg-[#4285F4]', oauthKey: 'google-drive' },
  { type: 'hubspot', name: 'HubSpot', description: 'CRM contacts, deals, and knowledge base', color: 'bg-[#FF7A59]', oauthKey: 'hubspot' },
  { type: 'discord', name: 'Discord', description: 'Server messages, threads, and channels', color: 'bg-[#5865F2]', oauthKey: 'discord' },
  { type: 'intercom', name: 'Intercom', description: 'Customer conversations and articles', color: 'bg-[#1F8DED]', oauthKey: null, comingSoon: true },
  { type: 'stripe', name: 'Stripe', description: 'Events, customers, and subscriptions', color: 'bg-[#635BFF]', oauthKey: null, comingSoon: true },
  { type: 'confluence', name: 'Confluence', description: 'Spaces, pages, and blog posts', color: 'bg-[#1868DB]', oauthKey: null, comingSoon: true },
];

export function ConnectorGrid() {
  const { org, loading: orgLoading } = useOrg();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/connectors');
      if (!res.ok) throw new Error('Failed to fetch connectors');
      const data = await res.json();
      setConnectors(data.connectors);
    } catch {
      toast({ title: 'Error', description: 'Failed to load connectors.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  // Show toast for OAuth success/error from redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) {
      toast({ title: 'Connected', description: success });
      // Re-fetch to show updated connector
      fetchConnectors();
    }
    if (error) {
      toast({ title: 'Connection failed', description: error, variant: 'destructive' });
    }
  }, [searchParams, toast, fetchConnectors]);

  const handleConnect = async (oauthKey: string) => {
    if (!org) return;
    setConnecting(oauthKey);
    try {
      const res = await fetch(`/api/v1/connectors/${oauthKey}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate connection');
      // Redirect to OAuth provider
      window.location.href = data.oauth_url;
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Connection failed',
        variant: 'destructive',
      });
      setConnecting(null);
    }
  };

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Build a map of connected connectors by type
  const connectorMap = new Map(connectors.map((c) => [c.type, c]));

  const connected = ALL_CONNECTORS.filter((c) => connectorMap.has(c.type));
  const available = ALL_CONNECTORS.filter((c) => !connectorMap.has(c.type));

  return (
    <div className="space-y-8">
      {connected.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Connected ({connected.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connected.map((def) => {
              const record = connectorMap.get(def.type)!;
              return (
                <ConnectorCard
                  key={def.type}
                  name={def.name}
                  description={def.description}
                  color={def.color}
                  status={record.status === 'error' ? 'error' : 'connected'}
                  lastSync={record.last_sync_at ?? undefined}
                  itemCount={record.events_processed}
                />
              );
            })}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Available ({available.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {available.map((def) => (
              <ConnectorCard
                key={def.type}
                name={def.name}
                description={def.description}
                color={def.color}
                status="available"
                onConnect={def.oauthKey ? () => handleConnect(def.oauthKey!) : undefined}
                connectLoading={connecting === def.oauthKey}
                comingSoon={def.comingSoon}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
