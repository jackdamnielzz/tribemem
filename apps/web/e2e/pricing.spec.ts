import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('pricing page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Simple, transparent pricing' })).toBeVisible();
    await expect(page.getByText('Start free, scale as your team grows')).toBeVisible();
  });

  test('all plan tiers are displayed', async ({ page }) => {
    const planNames = ['Free', 'Starter', 'Growth', 'Business', 'Enterprise'];
    for (const name of planNames) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
  });

  test('plan prices are displayed', async ({ page }) => {
    // Free plan shows 0
    await expect(page.getByText('0').first()).toBeVisible();
    // Starter plan
    await expect(page.getByText('49')).toBeVisible();
    // Growth plan
    await expect(page.getByText('149')).toBeVisible();
    // Business plan
    await expect(page.getByText('399')).toBeVisible();
    // Enterprise shows Custom
    await expect(page.getByText('Custom').first()).toBeVisible();
  });

  test('Growth plan is highlighted as most popular', async ({ page }) => {
    await expect(page.getByText('Most popular')).toBeVisible();
  });

  test('Free plan features are listed', async ({ page }) => {
    await expect(page.getByText('500 knowledge items')).toBeVisible();
    await expect(page.getByText('1 connector')).toBeVisible();
    await expect(page.getByText('100 queries / month')).toBeVisible();
    await expect(page.getByText('Community support')).toBeVisible();
  });

  test('Starter plan features are listed', async ({ page }) => {
    await expect(page.getByText('5,000 knowledge items')).toBeVisible();
    await expect(page.getByText('3 connectors')).toBeVisible();
    await expect(page.getByText('Up to 10 users')).toBeVisible();
    await expect(page.getByText('Email support')).toBeVisible();
  });

  test('Growth plan features are listed', async ({ page }) => {
    await expect(page.getByText('25,000 knowledge items')).toBeVisible();
    await expect(page.getByText('10 connectors')).toBeVisible();
    await expect(page.getByText('Conflict detection')).toBeVisible();
    await expect(page.getByText('API access')).toBeVisible();
  });

  test('Business plan features are listed', async ({ page }) => {
    await expect(page.getByText('100,000 knowledge items')).toBeVisible();
    await expect(page.getByText('Unlimited connectors')).toBeVisible();
    await expect(page.getByText('SSO / SAML')).toBeVisible();
    await expect(page.getByText('Audit logs')).toBeVisible();
    await expect(page.getByText('SLA guarantee')).toBeVisible();
  });

  test('Enterprise plan features are listed', async ({ page }) => {
    await expect(page.getByText('Unlimited everything')).toBeVisible();
    await expect(page.getByText('On-premise deployment')).toBeVisible();
    await expect(page.getByText('Dedicated account manager')).toBeVisible();
    await expect(page.getByText('Data residency options')).toBeVisible();
  });

  test('CTA buttons are present for each plan', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Start free' })).toBeVisible();
    const trialButtons = page.getByRole('link', { name: 'Start trial' });
    await expect(trialButtons).toHaveCount(3);
    await expect(page.getByRole('link', { name: 'Contact sales' })).toBeVisible();
  });

  test('FAQ section is displayed', async ({ page }) => {
    await expect(page.getByText('Frequently asked questions')).toBeVisible();
    await expect(page.getByText('What is a knowledge item?')).toBeVisible();
    await expect(page.getByText('Can I upgrade or downgrade at any time?')).toBeVisible();
    await expect(page.getByText('What connectors are available?')).toBeVisible();
    await expect(page.getByText('How does the crawler work?')).toBeVisible();
    await expect(page.getByText('Is my data secure?')).toBeVisible();
    await expect(page.getByText('Do you offer a free trial?')).toBeVisible();
  });

  test('FAQ accordion expands to reveal answers', async ({ page }) => {
    const faqTrigger = page.getByText('What is a knowledge item?');
    await faqTrigger.click();
    await expect(
      page.getByText(/piece of structured information that TribeMem extracts/)
    ).toBeVisible();
  });

  test('plan descriptions are displayed', async ({ page }) => {
    await expect(page.getByText('For individuals exploring knowledge management')).toBeVisible();
    await expect(page.getByText('For small teams getting started')).toBeVisible();
    await expect(page.getByText('For growing teams with more integrations')).toBeVisible();
    await expect(page.getByText('For organizations needing full coverage')).toBeVisible();
    await expect(page.getByText('For large organizations with custom needs')).toBeVisible();
  });
});
