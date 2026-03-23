'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Brain,
  Plug,
  Search,
  AlertTriangle,
  TrendingUp,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OverviewPage() {
  const [stats, setStats] = useState({ knowledge: 0, connectors: 0, queries: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [connectorsRes, alertsRes, knowledgeRes, queriesRes] = await Promise.allSettled([
        fetch('/api/v1/connectors'),
        fetch('/api/v1/alerts'),
        fetch('/api/v1/knowledge'),
        fetch('/api/v1/queries'),
      ]);

      const connectors = connectorsRes.status === 'fulfilled' && connectorsRes.value.ok
        ? (await connectorsRes.value.json()).connectors?.length ?? 0 : 0;
      const alerts = alertsRes.status === 'fulfilled' && alertsRes.value.ok
        ? (await alertsRes.value.json()).alerts?.length ?? 0 : 0;
      const knowledge = knowledgeRes.status === 'fulfilled' && knowledgeRes.value.ok
        ? (await knowledgeRes.value.json()).total ?? 0 : 0;
      const queries = queriesRes.status === 'fulfilled' && queriesRes.value.ok
        ? (await queriesRes.value.json()).total ?? 0 : 0;

      setStats({ knowledge, connectors, alerts, queries });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Knowledge', value: stats.knowledge.toLocaleString(), icon: Brain, color: 'text-primary' },
    { label: 'Active Connectors', value: stats.connectors.toString(), icon: Plug, color: 'text-emerald-500' },
    { label: 'Queries', value: stats.queries.toLocaleString(), icon: Search, color: 'text-amber-500' },
    { label: 'Pending Alerts', value: stats.alerts.toString(), icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Your organization&apos;s knowledge at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Knowledge Growth Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Knowledge Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No data yet</p>
                <p className="text-xs text-muted-foreground">Connect a source to start tracking growth</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" />
              Recent Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No queries yet</p>
                <p className="text-xs text-muted-foreground">Ask a question to get started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
