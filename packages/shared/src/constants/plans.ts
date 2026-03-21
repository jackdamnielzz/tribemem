import type { Plan, PlanId } from '../types/billing';

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with organizational knowledge management',
    price_monthly_eur: 0,
    price_yearly_eur: 0,
    limits: {
      max_connectors: 1,
      max_members: 3,
      max_queries_per_month: 50,
      max_knowledge_units: 500,
      max_crawl_runs_per_day: 1,
      max_api_keys: 1,
      retention_days: 30,
    },
    features: [
      'Single connector integration',
      'Basic knowledge extraction',
      'Query interface',
      'Email support',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams getting serious about knowledge management',
    price_monthly_eur: 49,
    price_yearly_eur: 470,
    limits: {
      max_connectors: 3,
      max_members: 10,
      max_queries_per_month: 500,
      max_knowledge_units: 5000,
      max_crawl_runs_per_day: 5,
      max_api_keys: 5,
      retention_days: 90,
    },
    features: [
      'Up to 3 connector integrations',
      'Advanced knowledge extraction',
      'Contradiction detection',
      'Basic analytics',
      'API access',
      'Priority email support',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'For growing organizations scaling their knowledge base',
    price_monthly_eur: 149,
    price_yearly_eur: 1430,
    limits: {
      max_connectors: 8,
      max_members: 50,
      max_queries_per_month: 2000,
      max_knowledge_units: 25000,
      max_crawl_runs_per_day: 20,
      max_api_keys: 20,
      retention_days: 365,
    },
    features: [
      'Up to 8 connector integrations',
      'Full knowledge extraction suite',
      'Contradiction & drift detection',
      'Advanced analytics & dashboards',
      'Entity relationship mapping',
      'Custom alert rules',
      'API access with higher limits',
      'Chat & email support',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For large organizations with advanced needs',
    price_monthly_eur: 399,
    price_yearly_eur: 3830,
    limits: {
      max_connectors: null,
      max_members: 200,
      max_queries_per_month: 10000,
      max_knowledge_units: null,
      max_crawl_runs_per_day: null,
      max_api_keys: 100,
      retention_days: null,
    },
    features: [
      'Unlimited connector integrations',
      'Unlimited knowledge units',
      'Full knowledge extraction suite',
      'Advanced contradiction & drift detection',
      'Full analytics & custom reports',
      'Entity relationship mapping',
      'Custom alert rules & webhooks',
      'SSO support',
      'Dedicated account manager',
      'Phone, chat & email support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for enterprise organizations',
    price_monthly_eur: null,
    price_yearly_eur: null,
    limits: {
      max_connectors: null,
      max_members: null,
      max_queries_per_month: null,
      max_knowledge_units: null,
      max_crawl_runs_per_day: null,
      max_api_keys: null,
      retention_days: null,
    },
    features: [
      'Everything in Business',
      'Custom connector development',
      'On-premise deployment option',
      'Advanced security & compliance',
      'Custom SLA',
      'Dedicated infrastructure',
      'Custom integrations',
      '24/7 priority support',
      'Training & onboarding',
    ],
  },
};

/**
 * Returns the plan definition for a given plan ID.
 */
export function getPlan(planId: PlanId): Plan {
  return PLANS[planId];
}

/**
 * Checks whether a given limit is within plan bounds.
 * Returns true if the limit is null (unlimited) or the value is within the limit.
 */
export function isWithinPlanLimit(
  limit: number | null,
  currentValue: number,
): boolean {
  if (limit === null) return true;
  return currentValue < limit;
}
