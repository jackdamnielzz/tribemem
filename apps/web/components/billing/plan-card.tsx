import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  name: string;
  price: number | null;
  period: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

export function PlanCard({ name, price, period, features, highlighted = false, ctaLabel, onAction, loading }: PlanCardProps) {
  return (
    <Card className={cn('flex flex-col', highlighted && 'border-primary shadow-lg shadow-primary/10')}>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <div className="mt-2">
          {price !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">&euro;{price}</span>
              <span className="text-sm text-muted-foreground">/{period}</span>
            </div>
          ) : (
            <span className="text-2xl font-bold">Custom pricing</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={highlighted ? 'default' : 'outline'}
          onClick={onAction}
          disabled={loading || !onAction}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {ctaLabel || 'Upgrade'}
        </Button>
      </CardFooter>
    </Card>
  );
}
