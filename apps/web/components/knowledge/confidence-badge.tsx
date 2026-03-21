import React from 'react';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number;
  compact?: boolean;
}

export function ConfidenceBadge({ confidence, compact = false }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  const getColor = () => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full', getColor())} style={{ width: `${percentage}%` }} />
        </div>
        <span className={cn('text-xs font-medium', getTextColor())}>{percentage}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Confidence</span>
        <span className={cn('text-xs font-medium', getTextColor())}>{percentage}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', getColor())} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
