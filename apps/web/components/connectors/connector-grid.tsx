'use client';

import React from 'react';
import { ConnectorCard } from '@/components/connectors/connector-card';

const connectors = [
  {
    name: 'Slack',
    description: 'Chat messages, threads, and channels',
    color: 'bg-[#4A154B]',
    status: 'connected' as const,
    lastSync: '2024-01-16T10:30:00Z',
    itemCount: 1247,
  },
  {
    name: 'Notion',
    description: 'Pages, databases, and wikis',
    color: 'bg-[#191919]',
    status: 'connected' as const,
    lastSync: '2024-01-16T09:00:00Z',
    itemCount: 843,
  },
  {
    name: 'Jira',
    description: 'Issues, epics, and project boards',
    color: 'bg-[#0052CC]',
    status: 'connected' as const,
    lastSync: '2024-01-16T08:00:00Z',
    itemCount: 356,
  },
  {
    name: 'GitHub',
    description: 'Repositories, PRs, and discussions',
    color: 'bg-[#24292F]',
    status: 'error' as const,
  },
  {
    name: 'Intercom',
    description: 'Customer conversations and articles',
    color: 'bg-[#1F8DED]',
    status: 'connected' as const,
    lastSync: '2024-01-16T07:30:00Z',
    itemCount: 189,
  },
  {
    name: 'Linear',
    description: 'Issues, projects, and roadmaps',
    color: 'bg-[#5E6AD2]',
    status: 'connected' as const,
    lastSync: '2024-01-16T06:00:00Z',
    itemCount: 421,
  },
  {
    name: 'Google Drive',
    description: 'Documents, sheets, and presentations',
    color: 'bg-[#4285F4]',
    status: 'available' as const,
  },
  {
    name: 'HubSpot',
    description: 'CRM contacts, deals, and knowledge base',
    color: 'bg-[#FF7A59]',
    status: 'available' as const,
  },
  {
    name: 'Confluence',
    description: 'Spaces, pages, and blog posts',
    color: 'bg-[#1868DB]',
    status: 'available' as const,
  },
];

export function ConnectorGrid() {
  const connected = connectors.filter((c) => c.status !== 'available');
  const available = connectors.filter((c) => c.status === 'available');

  return (
    <div className="space-y-8">
      {connected.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Connected ({connected.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connected.map((connector) => (
              <ConnectorCard key={connector.name} {...connector} />
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Available ({available.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {available.map((connector) => (
              <ConnectorCard key={connector.name} {...connector} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
