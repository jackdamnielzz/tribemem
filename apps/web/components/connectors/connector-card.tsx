'use client';

import React from 'react';
import { Plug, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SyncStatus } from '@/components/connectors/sync-status';
import { formatRelativeTime } from '@/lib/utils';

interface ConnectorCardProps {
  name: string;
  description: string;
  color: string;
  status: 'connected' | 'available' | 'error';
  lastSync?: string;
  itemCount?: number;
}

export function ConnectorCard({
  name,
  description,
  color,
  status,
  lastSync,
  itemCount,
}: ConnectorCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Plug className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{name}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          {status === 'connected' && (
            <Badge variant="success" className="text-xs">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          )}
          {status === 'error' && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="mr-1 h-3 w-3" />
              Error
            </Badge>
          )}
        </div>

        {status === 'connected' && (
          <div className="mt-4 space-y-2">
            <SyncStatus status="idle" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {lastSync && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last sync: {formatRelativeTime(lastSync)}
                </span>
              )}
              {itemCount !== undefined && (
                <span>{itemCount} items</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          {status === 'connected' ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Configure
              </Button>
              <Button variant="outline" size="sm">
                Sync
              </Button>
            </div>
          ) : (
            <Button size="sm" className="w-full">
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
