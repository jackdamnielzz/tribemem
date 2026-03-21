'use client';

import React from 'react';
import {
  Brain,
  Plug,
  Search,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const stats = [
  { label: 'Total Knowledge', value: '2,847', change: '+124 this week', icon: Brain, color: 'text-primary' },
  { label: 'Active Connectors', value: '6', change: '2 syncing', icon: Plug, color: 'text-emerald-500' },
  { label: 'Queries This Week', value: '342', change: '+18% vs last week', icon: Search, color: 'text-amber-500' },
  { label: 'Pending Alerts', value: '7', change: '3 conflicts, 4 stale', icon: AlertTriangle, color: 'text-red-500' },
];

const recentQueries = [
  { query: 'What is our refund policy for enterprise clients?', time: '5 min ago', sources: 3 },
  { query: 'How do we handle GDPR data deletion requests?', time: '23 min ago', sources: 5 },
  { query: 'What are the steps for deploying to production?', time: '1 hour ago', sources: 4 },
  { query: 'Who approves budget requests over 10k?', time: '2 hours ago', sources: 2 },
  { query: 'What is our SLA for Tier 1 support tickets?', time: '3 hours ago', sources: 3 },
];

const alerts = [
  {
    id: 1,
    type: 'conflict',
    title: 'Conflicting refund policies detected',
    description: 'Slack message contradicts Notion doc on 30-day refund window',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'stale',
    title: 'Deployment process may be outdated',
    description: 'Last confirmed 47 days ago, confidence dropped to 62%',
    time: '5 hours ago',
  },
  {
    id: 3,
    type: 'conflict',
    title: 'Pricing discrepancy for Growth plan',
    description: 'Website shows different price than internal docs',
    time: '1 day ago',
  },
  {
    id: 4,
    type: 'stale',
    title: 'On-call rotation schedule needs review',
    description: 'Last updated 60 days ago, 3 team members changed since',
    time: '1 day ago',
  },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Your organization&apos;s knowledge at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
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
                <p className="mt-2 text-sm text-muted-foreground">Knowledge growth chart</p>
                <p className="text-xs text-muted-foreground">Tracking items added over time</p>
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
            <div className="space-y-3">
              {recentQueries.map((q, i) => (
                <div key={i} className="flex items-start justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{q.query}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{q.time}</span>
                      <span className="text-xs text-muted-foreground">|</span>
                      <span className="text-xs text-muted-foreground">{q.sources} sources</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-2 w-2 rounded-full ${
                      alert.type === 'conflict' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{alert.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.type === 'conflict' ? 'destructive' : 'warning'}>
                    {alert.type}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
