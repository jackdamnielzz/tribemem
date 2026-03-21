'use client';

import React, { useState } from 'react';
import { Plus, Grid3X3, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KnowledgeCard } from '@/components/knowledge/knowledge-card';
import { KnowledgeTable } from '@/components/knowledge/knowledge-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Brain } from 'lucide-react';

const mockFacts = [
  {
    id: '1',
    title: 'Enterprise refund window is 30 days',
    type: 'fact' as const,
    category: 'Policy',
    confidence: 0.95,
    sourceCount: 4,
    lastConfirmed: '2024-01-15',
    status: 'active' as const,
  },
  {
    id: '2',
    title: 'Default API rate limit is 1000 requests per minute',
    type: 'fact' as const,
    category: 'Technical',
    confidence: 0.88,
    sourceCount: 2,
    lastConfirmed: '2024-01-10',
    status: 'active' as const,
  },
  {
    id: '3',
    title: 'GDPR data deletion must complete within 72 hours',
    type: 'fact' as const,
    category: 'Compliance',
    confidence: 0.72,
    sourceCount: 3,
    lastConfirmed: '2023-12-20',
    status: 'stale' as const,
  },
  {
    id: '4',
    title: 'Support team works in 3 timezone-based shifts',
    type: 'fact' as const,
    category: 'Operations',
    confidence: 0.91,
    sourceCount: 5,
    lastConfirmed: '2024-01-12',
    status: 'active' as const,
  },
  {
    id: '5',
    title: 'Maximum file upload size is 100MB',
    type: 'fact' as const,
    category: 'Technical',
    confidence: 0.65,
    sourceCount: 1,
    lastConfirmed: '2023-11-30',
    status: 'stale' as const,
  },
];

export default function FactsPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');

  const filteredFacts = mockFacts.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facts</h1>
          <p className="text-muted-foreground">Verified facts about your organization</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add fact
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search facts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any confidence</SelectItem>
            <SelectItem value="high">High (&gt;80%)</SelectItem>
            <SelectItem value="medium">Medium (50-80%)</SelectItem>
            <SelectItem value="low">Low (&lt;50%)</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="stale">Stale</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-md border border-border">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setView('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setView('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {filteredFacts.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No facts found"
          description="No facts match your current filters. Try adjusting your search or add a new fact."
          actionLabel="Add fact"
          onAction={() => {}}
        />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFacts.map((fact) => (
            <KnowledgeCard key={fact.id} item={fact} />
          ))}
        </div>
      ) : (
        <KnowledgeTable items={filteredFacts} />
      )}
    </div>
  );
}
