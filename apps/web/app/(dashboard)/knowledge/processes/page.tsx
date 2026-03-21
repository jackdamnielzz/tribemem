'use client';

import React, { useState } from 'react';
import { Plus, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KnowledgeCard } from '@/components/knowledge/knowledge-card';
import { KnowledgeTable } from '@/components/knowledge/knowledge-table';
import { EmptyState } from '@/components/shared/empty-state';
import { GitBranch } from 'lucide-react';

const mockProcesses = [
  {
    id: '1',
    title: 'Production deployment requires staging approval first',
    type: 'process' as const,
    category: 'Engineering',
    confidence: 0.93,
    sourceCount: 6,
    lastConfirmed: '2024-01-14',
    status: 'active' as const,
  },
  {
    id: '2',
    title: 'New hire onboarding follows 30-60-90 day plan',
    type: 'process' as const,
    category: 'People',
    confidence: 0.87,
    sourceCount: 3,
    lastConfirmed: '2024-01-08',
    status: 'active' as const,
  },
  {
    id: '3',
    title: 'Customer escalation goes Support > Lead > VP',
    type: 'process' as const,
    category: 'Support',
    confidence: 0.78,
    sourceCount: 4,
    lastConfirmed: '2023-12-15',
    status: 'active' as const,
  },
  {
    id: '4',
    title: 'Feature requests triaged weekly by product team',
    type: 'process' as const,
    category: 'Product',
    confidence: 0.69,
    sourceCount: 2,
    lastConfirmed: '2023-11-20',
    status: 'stale' as const,
  },
];

export default function ProcessesPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');

  const filtered = mockProcesses.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processes</h1>
          <p className="text-muted-foreground">How things get done in your organization</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add process
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search processes..."
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
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="people">People</SelectItem>
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
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-md border border-border">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setView('grid')}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setView('table')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={GitBranch} title="No processes found" description="No processes match your filters." actionLabel="Add process" onAction={() => {}} />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (<KnowledgeCard key={item.id} item={item} />))}
        </div>
      ) : (
        <KnowledgeTable items={filtered} />
      )}
    </div>
  );
}
