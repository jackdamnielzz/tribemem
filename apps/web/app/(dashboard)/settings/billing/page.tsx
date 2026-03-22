'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlanCard } from '@/components/billing/plan-card';
import { UsageBar } from '@/components/billing/usage-bar';
import { useToast } from '@/components/ui/use-toast';
import { PLANS } from '@tribemem/shared/src/constants/plans';
import type { PlanId } from '@tribemem/shared/src/types/billing';

interface BillingData {
  plan: PlanId;
  stripe_customer_id: string | null;
  usage: {
    crawl_events: number;
    extractions: number;
    queries: number;
    api_calls: number;
    tokens_used: number;
  };
  usage_reset_at: string;
  members_count: number;
  connectors_count: number;
  subscription: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    items: { price_id: string; product_id: string; quantity: number }[];
  } | null;
  billing_events: {
    id: string;
    event_type: string;
    amount_cents: number;
    currency: string;
    description: string | null;
    created_at: string;
  }[];
}

export default function BillingPage() {
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch('/api/billing');
      if (!res.ok) throw new Error('Failed to fetch billing data');
      const data = await res.json();
      setBilling(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load billing data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handleUpgrade = async (priceId: string) => {
    setActionLoading(priceId);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout');
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Checkout failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlanChange = async (priceId: string) => {
    setActionLoading(priceId);
    try {
      const res = await fetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change plan');
      toast({ title: 'Plan updated', description: 'Your subscription has been updated.' });
      await fetchBilling();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Plan change failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      const res = await fetch('/api/billing', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      toast({ title: 'Subscription cancelled', description: data.message });
      await fetchBilling();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Cancel failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Failed to load billing data.
      </div>
    );
  }

  const currentPlan = PLANS[billing.plan] || PLANS.free;
  const limits = currentPlan.limits;
  const hasSubscription = !!billing.subscription;
  const isCancelling = billing.subscription?.cancel_at_period_end;

  // Determine which plans to show as upgrade options
  const upgradePlans = (['starter', 'growth', 'business', 'enterprise'] as PlanId[]).filter(
    (id) => id !== billing.plan,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current plan</CardTitle>
              <CardDescription>
                You are on the {currentPlan.name} plan
                {isCancelling && ' (cancels at end of period)'}
              </CardDescription>
            </div>
            <Badge className={isCancelling ? 'bg-amber-500' : 'bg-primary'}>{currentPlan.name}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-1">
            {currentPlan.price_monthly_eur !== null ? (
              <>
                <span className="text-4xl font-bold">&euro;{currentPlan.price_monthly_eur}</span>
                <span className="text-muted-foreground">/month</span>
              </>
            ) : (
              <span className="text-2xl font-bold">Custom pricing</span>
            )}
          </div>

          {billing.subscription && (
            <p className="text-sm text-muted-foreground">
              Current period ends{' '}
              {new Date(billing.subscription.current_period_end * 1000).toLocaleDateString()}
            </p>
          )}

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Usage this period</h4>
            {limits.max_knowledge_units !== null && (
              <UsageBar label="Knowledge items" current={billing.usage.extractions} limit={limits.max_knowledge_units} />
            )}
            {limits.max_connectors !== null ? (
              <UsageBar label="Connectors" current={billing.connectors_count} limit={limits.max_connectors} />
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connectors</span>
                <span className="font-medium">{billing.connectors_count} (unlimited)</span>
              </div>
            )}
            {limits.max_queries_per_month !== null ? (
              <UsageBar label="Queries" current={billing.usage.queries} limit={limits.max_queries_per_month} />
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Queries</span>
                <span className="font-medium">{billing.usage.queries.toLocaleString()} (unlimited)</span>
              </div>
            )}
            {limits.max_members !== null ? (
              <UsageBar label="Team members" current={billing.members_count} limit={limits.max_members} />
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Team members</span>
                <span className="font-medium">{billing.members_count} (unlimited)</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          {!hasSubscription && billing.plan === 'free' && (
            <Button onClick={() => {
              const starterPrice = PLANS.starter.stripe_price_id_monthly;
              if (starterPrice) handleUpgrade(starterPrice);
            }}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Upgrade plan
            </Button>
          )}
          {hasSubscription && !isCancelling && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={actionLoading === 'cancel'}
            >
              {actionLoading === 'cancel' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel subscription
            </Button>
          )}
          {isCancelling && (
            <p className="text-sm text-amber-600">
              Your plan will downgrade to Free on{' '}
              {new Date(billing.subscription!.current_period_end * 1000).toLocaleDateString()}.
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          {hasSubscription ? 'Change plan' : 'Available plans'}
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {upgradePlans.map((planId) => {
            const plan = PLANS[planId];
            const priceId = plan.stripe_price_id_monthly;
            const isCurrentlyHigher = getPlanTier(planId) > getPlanTier(billing.plan);

            return (
              <PlanCard
                key={planId}
                name={plan.name}
                price={plan.price_monthly_eur}
                period="month"
                features={plan.features.slice(0, 5)}
                highlighted={planId === 'growth'}
                ctaLabel={
                  planId === 'enterprise'
                    ? 'Contact sales'
                    : hasSubscription
                      ? isCurrentlyHigher ? 'Upgrade' : 'Downgrade'
                      : 'Get started'
                }
                onAction={
                  planId === 'enterprise' || !priceId
                    ? undefined
                    : () => (hasSubscription ? handlePlanChange(priceId) : handleUpgrade(priceId))
                }
                loading={actionLoading === priceId}
              />
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      {billing.billing_events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {billing.billing_events.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(event.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.description || formatEventType(event.event_type)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {event.amount_cents > 0 && (
                      <span className="text-sm font-medium">
                        &euro;{(event.amount_cents / 100).toFixed(2)}
                      </span>
                    )}
                    <Badge variant={event.event_type.includes('fail') ? 'destructive' : 'secondary'}>
                      {formatEventType(event.event_type)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getPlanTier(planId: string): number {
  const tiers: Record<string, number> = { free: 0, starter: 1, growth: 2, business: 3, enterprise: 4 };
  return tiers[planId] ?? 0;
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
