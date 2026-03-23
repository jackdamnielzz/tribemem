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

export default function DecisionsPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');

  // TODO: fetch from API
  const decisions: Array<{ id: string; title: string; type: 'decision'; category: string; confidence: number; sourceCount: number; lastConfirmed: string; status: 'active' | 'stale' }> = [];

  const filtered = decisions.filter((d) =>
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
        <EmptyState icon={Scale} title="No decisions yet" description="Decisions will appear here once the crawler extracts knowledge from your connected sources." actionLabel="Add decision" onAction={() => {}} />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => (<KnowledgeCard key={item.id} item={item} />))}</div>
      ) : (
        <KnowledgeTable items={filtered} />
      )}
    </div>
  );
}
