import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface KnowledgeTableProps {
  items: KnowledgeItem[];
}

export function KnowledgeTable({ items }: KnowledgeTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Sources</TableHead>
            <TableHead>Last confirmed</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="cursor-pointer">
              <TableCell className="max-w-[300px] font-medium">
                <span className="line-clamp-1">{item.title}</span>
              </TableCell>
              <TableCell><TypeBadge type={item.type} /></TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
              <TableCell><ConfidenceBadge confidence={item.confidence} compact /></TableCell>
              <TableCell className="text-muted-foreground">{item.sourceCount}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(item.lastConfirmed)}</TableCell>
              <TableCell>
                {item.status === 'active' && <Badge variant="success" className="text-xs">Active</Badge>}
                {item.status === 'stale' && <Badge variant="warning" className="text-xs">Stale</Badge>}
                {item.status === 'disputed' && <Badge variant="destructive" className="text-xs">Disputed</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
