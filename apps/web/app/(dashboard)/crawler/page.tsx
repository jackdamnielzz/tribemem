'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bot, Play, Pause, RefreshCw, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CrawlerRun {
  id: string;
  connector: string;
  status: string;
  started_at: string;
  duration: string | null;
  items_found: number;
  items_new: number;
  items_updated: number;
  error?: string;
}

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
  const [runs, setRuns] = useState<CrawlerRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/crawler/runs');
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const totalToday = runs.length;
  const itemsDiscovered = runs.reduce((sum, r) => sum + (r.items_found || 0), 0);
  const activeCrawlers = runs.filter((r) => r.status === 'running').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              <span className="text-sm text-muted-foreground">Total runs</span>
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold">{totalToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Items discovered</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">{itemsDiscovered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active crawlers</span>
              <RefreshCw className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">{activeCrawlers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next scheduled</span>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-xl font-bold">-</p>
          </CardContent>
        </Card>
      </div>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No crawler runs yet</p>
              <p className="text-xs text-muted-foreground">Connect a source and run the crawler to see results here</p>
            </div>
          ) : (
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
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.connector}</TableCell>
                    <TableCell><StatusBadge status={run.status} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(run.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{run.duration ?? '-'}</TableCell>
                    <TableCell className="text-right">{run.items_found}</TableCell>
                    <TableCell className="text-right text-emerald-500">+{run.items_new}</TableCell>
                    <TableCell className="text-right text-primary">{run.items_updated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
