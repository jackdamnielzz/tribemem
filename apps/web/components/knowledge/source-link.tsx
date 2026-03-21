import React from 'react';
import { ExternalLink, MessageSquare, FileText, GitBranch, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceLinkProps {
  connector: 'slack' | 'notion' | 'jira' | 'github' | 'confluence' | 'other';
  title: string;
  url?: string;
  className?: string;
}

const connectorIcons = {
  slack: MessageSquare,
  notion: FileText,
  jira: Bug,
  github: GitBranch,
  confluence: FileText,
  other: ExternalLink,
};

const connectorColors = {
  slack: 'text-[#4A154B]',
  notion: 'text-foreground',
  jira: 'text-[#0052CC]',
  github: 'text-foreground',
  confluence: 'text-[#1868DB]',
  other: 'text-muted-foreground',
};

export function SourceLink({ connector, title, url, className }: SourceLinkProps) {
  const Icon = connectorIcons[connector] || connectorIcons.other;

  const content = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent',
        className
      )}
    >
      <Icon className={cn('h-3 w-3', connectorColors[connector])} />
      <span className="max-w-[200px] truncate">{title}</span>
      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
