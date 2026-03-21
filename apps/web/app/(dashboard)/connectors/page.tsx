'use client';

import React from 'react';
import { ConnectorGrid } from '@/components/connectors/connector-grid';

export default function ConnectorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connectors</h1>
        <p className="text-muted-foreground">
          Connect your tools to automatically capture organizational knowledge
        </p>
      </div>
      <ConnectorGrid />
    </div>
  );
}
