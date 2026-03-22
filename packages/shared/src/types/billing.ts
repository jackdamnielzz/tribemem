export type PlanId = 'free' | 'starter' | 'growth' | 'business' | 'enterprise';

export type BillingInterval = 'monthly' | 'yearly';

export type BillingEventType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'trial_started'
  | 'trial_ended'
  | 'usage_limit_reached'
  | 'usage_limit_warning';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price_monthly_eur: number | null;
  price_yearly_eur: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  limits: PlanLimits;
  features: string[];
}

export interface PlanLimits {
  max_connectors: number | null;
  max_members: number | null;
  max_queries_per_month: number | null;
  max_knowledge_units: number | null;
  max_crawl_runs_per_day: number | null;
  max_api_keys: number | null;
  retention_days: number | null;
}

export interface BillingEvent {
  id: string;
  org_id: string;
  type: BillingEventType;
  plan_id: PlanId;
  amount_eur: number | null;
  currency: string;
  stripe_event_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UsagePeriod {
  id: string;
  org_id: string;
  plan_id: PlanId;
  period_start: string;
  period_end: string;
  queries_used: number;
  knowledge_units_count: number;
  connectors_count: number;
  members_count: number;
  api_calls_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  plan_id: PlanId;
  billing_interval: BillingInterval;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}
