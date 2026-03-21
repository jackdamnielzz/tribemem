import React from 'react';
import { cn } from '@/lib/utils';

interface TypeBadgeProps {
  type: 'fact' | 'process' | 'decision' | 'norm' | 'definition';
}

const typeConfig = {
  fact: { label: 'Fact', className: 'bg-blue-500/15 text-blue-500' },
  process: { label: 'Process', className: 'bg-purple-500/15 text-purple-500' },
  decision: { label: 'Decision', className: 'bg-amber-500/15 text-amber-500' },
  norm: { label: 'Norm', className: 'bg-emerald-500/15 text-emerald-500' },
  definition: { label: 'Definition', className: 'bg-slate-500/15 text-slate-400' },
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
