import React from 'react';
import { SourceLink } from '@/components/knowledge/source-link';

interface Source {
  connector: 'slack' | 'notion' | 'jira' | 'github' | 'confluence' | 'other';
  title: string;
  url?: string;
}

interface SourceCitationsProps {
  sources: Source[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, index) => (
          <SourceLink
            key={index}
            connector={source.connector}
            title={source.title}
            url={source.url}
          />
        ))}
      </div>
    </div>
  );
}
