'use client';

import React, { useState } from 'react';
import { Plus, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KnowledgeCard } from '@/components/knowledge/knowledge-card';
import { KnowledgeTable } from '@/components/knowledge/knowledge-table';
import { EmptyState } from '@/components/shared/empty-state';
import { BookOpen } from 'lucide-react';

const mockNorms = [
  {
    id: '1',
    title: 'All PRs require at least 2 code reviews before merging',
    type: 'norm' as const,
    category: 'Engineering',
    confidence: 0.96,
    sourceCount: 7,
    lastConfirmed: '2024-01-15',
    status: 'active' as const,
  },
  {
    id: '2',
    title: 'Customer-facing emails must be reviewed by marketing',
    type: 'norm' as const,
    category: 'Marketing',
    confidence: 0.84,
    sourceCount: 3,
    lastConfirmed: '2024-01-10',
    status: 'active' as const,
  },
  {
    id: '3',
    title: 'Stand-up meetings happen daily at 9:30 AM CET',
    type: 'norm' as const,
    category: 'Operations',
    confidence: 0.77,
    sourceCount: 2,
    lastConfirmed: '2023-12-18',
    status: 'active' as const,
  },
  {
    id: '4',
    title: 'Security vulnerabilities must be triaged within 4 hours',
    type: 'norm' as const,
    category: 'Security',
    confidence: 0.92,
    sourceCount: 5,
    lastConfirmed: '2024-01-13',
    status: 'active' as const,
  },
];

export default function NormsPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');

  const filtered = mockNorms.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Norms</h1>
          <p className="text-muted-foreground">Standards and practices your team follows</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add norm
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Search norms..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="security">Security</SelectItem>
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
        <EmptyState icon={BookOpen} title="No norms found" description="No norms match your filters." actionLabel="Add norm" onAction={() => {}} />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => (<KnowledgeCard key={item.id} item={item} />))}</div>
      ) : (
        <KnowledgeTable items={filtered} />
      )}
    </div>
  );
}
