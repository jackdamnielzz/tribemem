'use client';

import React from 'react';
import { Bot, Play, Pause, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const crawlerRuns = [
  {
    id: '1',
    connector: 'Slack',
    status: 'running',
    startedAt: '2024-01-16T10:30:00Z',
    duration: '12m 34s',
    itemsFound: 23,
    itemsNew: 8,
    itemsUpdated: 15,
  },
  {
    id: '2',
    connector: 'Notion',
    status: 'completed',
    startedAt: '2024-01-16T09:00:00Z',
    duration: '8m 12s',
    itemsFound: 45,
    itemsNew: 12,
    itemsUpdated: 33,
  },
  {
    id: '3',
    connector: 'Jira',
    status: 'completed',
    startedAt: '2024-01-16T08:00:00Z',
    duration: '5m 47s',
    itemsFound: 18,
    itemsNew: 3,
    itemsUpdated: 15,
  },
  {
    id: '4',
    connector: 'GitHub',
    status: 'failed',
    startedAt: '2024-01-16T07:00:00Z',
    duration: '2m 03s',
    itemsFound: 0,
    itemsNew: 0,
    itemsUpdated: 0,
    error: 'API rate limit exceeded',
  },
  {
    id: '5',
    connector: 'Slack',
    status: 'completed',
    startedAt: '2024-01-15T22:00:00Z',
    duration: '15m 22s',
    itemsFound: 67,
    itemsNew: 19,
    itemsUpdated: 48,
  },
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'running':
      return <Badge variant="default" className="bg-primary"><RefreshCw className="mr-1 h-3 w-3 animate-spin" />Running</Badge>;
    case 'completed':
      return <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function CrawlerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Crawler</h1>
          <p className="text-muted-foreground">Monitor and control knowledge extraction runs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Pause className="mr-2 h-4 w-4" />
            Pause all
          </Button>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Run now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total runs today</span>
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold">14</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Items discovered</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">153</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active crawlers</span>
              <RefreshCw className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">1</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next scheduled</span>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-xl font-bold">in 23 min</p>
          </CardContent>
        </Card>
      </div>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Found</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crawlerRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.connector}</TableCell>
                  <TableCell><StatusBadge status={run.status} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(run.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{run.duration}</TableCell>
                  <TableCell className="text-right">{run.itemsFound}</TableCell>
                  <TableCell className="text-right text-emerald-500">+{run.itemsNew}</TableCell>
                  <TableCell className="text-right text-primary">{run.itemsUpdated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
