import React from 'react';
import { RefreshCw, CheckCircle2, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusProps {
  status: 'syncing' | 'idle' | 'paused';
}

const statusConfig = {
  syncing: {
    icon: RefreshCw,
    label: 'Syncing...',
    className: 'text-primary',
    iconClassName: 'animate-spin',
    dotClassName: 'bg-primary',
  },
  idle: {
    icon: CheckCircle2,
    label: 'Up to date',
    className: 'text-emerald-500',
    iconClassName: '',
    dotClassName: 'bg-emerald-500',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    className: 'text-amber-500',
    iconClassName: '',
    dotClassName: 'bg-amber-500',
  },
};

export function SyncStatus({ status }: SyncStatusProps) {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', config.className)}>
      <div className={cn('h-1.5 w-1.5 rounded-full', config.dotClassName)} />
      <span>{config.label}</span>
    </div>
  );
}
