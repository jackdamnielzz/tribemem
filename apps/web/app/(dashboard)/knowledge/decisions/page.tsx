'use client';

import React, { useState } from 'react';
import { Plus, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KnowledgeCard } from '@/components/knowledge/knowledge-card';
import { KnowledgeTable } from '@/components/knowledge/knowledge-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Scale } from 'lucide-react';

const mockDecisions = [
  {
    id: '1',
    title: 'Adopted TypeScript as primary language for all new services',
    type: 'decision' as const,
    category: 'Engineering',
    confidence: 0.97,
    sourceCount: 8,
    lastConfirmed: '2024-01-16',
    status: 'active' as const,
  },
  {
    id: '2',
    title: 'Moved from Heroku to AWS ECS for production workloads',
    type: 'decision' as const,
    category: 'Infrastructure',
    confidence: 0.94,
    sourceCount: 5,
    lastConfirmed: '2024-01-05',
    status: 'active' as const,
  },
  {
    id: '3',
    title: 'Pricing increase of 15% for Growth plan effective Q2',
    type: 'decision' as const,
    category: 'Business',
    confidence: 0.82,
    sourceCount: 3,
    lastConfirmed: '2024-01-02',
    status: 'active' as const,
  },
  {
    id: '4',
    title: 'Remote-first policy with quarterly offsites',
    type: 'decision' as const,
    category: 'People',
    confidence: 0.91,
    sourceCount: 4,
    lastConfirmed: '2023-12-28',
    status: 'active' as const,
  },
];

export default function DecisionsPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');

  const filtered = mockDecisions.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Decisions</h1>
          <p className="text-muted-foreground">Key decisions made by your organization</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add decision
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Search decisions..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
            <SelectItem value="people">People</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="stale">Stale</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-md border border-border">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setView('grid')}><Grid3X3 className="h-4 w-4" /></Button>
          <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setView('table')}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Scale} title="No decisions found" description="No decisions match your filters." actionLabel="Add decision" onAction={() => {}} />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => (<KnowledgeCard key={item.id} item={item} />))}</div>
      ) : (
        <KnowledgeTable items={filtered} />
      )}
    </div>
  );
}
