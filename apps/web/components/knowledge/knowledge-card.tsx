import React from 'react';
import { FileText, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ConfidenceBadge } from '@/components/knowledge/confidence-badge';
import { TypeBadge } from '@/components/knowledge/type-badge';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface KnowledgeItem {
  id: string;
  title: string;
  type: 'fact' | 'process' | 'decision' | 'norm' | 'definition';
  category: string;
  confidence: number;
  sourceCount: number;
  lastConfirmed: string;
  status: 'active' | 'stale' | 'disputed';
}

interface KnowledgeCardProps {
  item: KnowledgeItem;
}

export function KnowledgeCard({ item }: KnowledgeCardProps) {
  return (
    <Card className="group cursor-pointer transition-colors hover:border-primary/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <TypeBadge type={item.type} />
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          </div>
          {item.status === 'stale' && (
            <Badge variant="warning" className="text-xs">Stale</Badge>
          )}
          {item.status === 'disputed' && (
            <Badge variant="destructive" className="text-xs">Disputed</Badge>
          )}
        </div>

        <h3 className="mt-3 text-sm font-medium leading-snug">{item.title}</h3>

        <div className="mt-4">
          <ConfidenceBadge confidence={item.confidence} />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{item.sourceCount} sources</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(item.lastConfirmed)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
