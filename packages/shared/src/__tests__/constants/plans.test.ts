import { describe, it, expect } from 'vitest';
import { PLANS, getPlan, isWithinPlanLimit } from '../../constants/plans';

describe('PLANS', () => {
  it('defines all five plan tiers', () => {
    expect(Object.keys(PLANS)).toEqual(
      expect.arrayContaining(['free', 'starter', 'growth', 'business', 'enterprise']),
    );
    expect(Object.keys(PLANS)).toHaveLength(5);
  });

  it('each plan has a matching id', () => {
    for (const [key, plan] of Object.entries(PLANS)) {
      expect(plan.id).toBe(key);
    }
  });

  it('free plan has price of 0', () => {
    expect(PLANS.free.price_monthly_usd).toBe(0);
    expect(PLANS.free.price_yearly_usd).toBe(0);
  });

  it('enterprise plan has null pricing', () => {
    expect(PLANS.enterprise.price_monthly_usd).toBeNull();
    expect(PLANS.enterprise.price_yearly_usd).toBeNull();
  });

  it('enterprise plan has all null limits', () => {
    const limits = PLANS.enterprise.limits;
    expect(limits.max_connectors).toBeNull();
    expect(limits.max_members).toBeNull();
    expect(limits.max_queries_per_month).toBeNull();
    expect(limits.max_knowledge_units).toBeNull();
    expect(limits.max_crawl_runs_per_day).toBeNull();
    expect(limits.max_api_keys).toBeNull();
    expect(limits.retention_days).toBeNull();
  });

  it('free plan has the most restrictive limits', () => {
    expect(PLANS.free.limits.max_connectors).toBe(1);
    expect(PLANS.free.limits.max_members).toBe(3);
    expect(PLANS.free.limits.max_queries_per_month).toBe(50);
    expect(PLANS.free.limits.max_knowledge_units).toBe(500);
  });

  it('each plan has at least one feature', () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it('yearly pricing is less than 12x monthly for paid plans', () => {
    for (const plan of Object.values(PLANS)) {
      if (plan.price_monthly_usd !== null && plan.price_yearly_usd !== null && plan.price_monthly_usd > 0) {
        expect(plan.price_yearly_usd).toBeLessThan(plan.price_monthly_usd * 12);
      }
    }
  });
});

describe('getPlan', () => {
  it('returns the correct plan for a given id', () => {
    expect(getPlan('free')).toBe(PLANS.free);
    expect(getPlan('starter')).toBe(PLANS.starter);
    expect(getPlan('growth')).toBe(PLANS.growth);
    expect(getPlan('business')).toBe(PLANS.business);
    expect(getPlan('enterprise')).toBe(PLANS.enterprise);
  });

  it('returns a plan with all required fields', () => {
    const plan = getPlan('starter');
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('description');
    expect(plan).toHaveProperty('price_monthly_usd');
    expect(plan).toHaveProperty('limits');
    expect(plan).toHaveProperty('features');
  });
});

describe('isWithinPlanLimit', () => {
  it('returns true when current value is below the limit', () => {
    expect(isWithinPlanLimit(10, 5)).toBe(true);
  });

  it('returns false when current value equals the limit', () => {
    expect(isWithinPlanLimit(10, 10)).toBe(false);
  });

  it('returns false when current value exceeds the limit', () => {
    expect(isWithinPlanLimit(10, 15)).toBe(false);
  });

  it('returns true when limit is null (unlimited)', () => {
    expect(isWithinPlanLimit(null, 999999)).toBe(true);
  });

  it('returns true for zero current value', () => {
    expect(isWithinPlanLimit(1, 0)).toBe(true);
  });
});
