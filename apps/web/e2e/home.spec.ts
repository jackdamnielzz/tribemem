import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/TribeMem/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('has TribeMem branding in header', async ({ page }) => {
    const header = page.locator('header');
    await expect(header.getByText('TribeMem')).toBeVisible();
  });

  test('hero section displays headline and description', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1 }).filter({ hasText: /knowledge/i })
    ).toBeVisible();
    await expect(
      page.getByText(/automatically captures, structures, and delivers/i)
    ).toBeVisible();
  });

  test('navigation links are visible', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav.getByText('Features')).toBeVisible();
    await expect(nav.getByText('How it works')).toBeVisible();
    await expect(nav.getByText('Pricing')).toBeVisible();
  });

  test('header auth buttons are visible', async ({ page }) => {
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Get started' })).toBeVisible();
  });

  test('CTA buttons are visible in hero section', async ({ page }) => {
    await expect(page.getByRole('link', { name: /start for free/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /see how it works/i })).toBeVisible();
  });

  test('CTA buttons are visible in bottom section', async ({ page }) => {
    await expect(page.getByRole('link', { name: /get started free/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /view pricing/i })).toBeVisible();
  });

  test('features section is displayed', async ({ page }) => {
    await expect(page.getByText('Everything you need')).toBeVisible();
    await expect(page.getByText('Structured Knowledge')).toBeVisible();
    await expect(page.getByText('Intelligent Crawler')).toBeVisible();
    await expect(page.getByText('Natural Language Q&A')).toBeVisible();
    await expect(page.getByText('Conflict Detection')).toBeVisible();
    await expect(page.getByText('Always Current')).toBeVisible();
    await expect(page.getByText('Deep Integrations')).toBeVisible();
  });

  test('how it works section is displayed', async ({ page }) => {
    await expect(page.getByText('How it works')).toBeVisible();
    await expect(page.getByText('Connect')).toBeVisible();
    await expect(page.getByText('Crawl')).toBeVisible();
    await expect(page.getByText('Query')).toBeVisible();
  });

  test('connectors section shows integrations', async ({ page }) => {
    await expect(page.getByText('Connects to your stack')).toBeVisible();
    for (const name of ['Slack', 'Notion', 'Jira', 'GitHub']) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test('navigation to pricing page works', async ({ page }) => {
    await page.locator('nav').getByText('Pricing').click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByText('Simple, transparent pricing')).toBeVisible();
  });

  test('navigation to signup via CTA works', async ({ page }) => {
    await page.getByRole('link', { name: /start for free/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('footer is displayed with correct sections', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByText('Product')).toBeVisible();
    await expect(footer.getByText('Integrations')).toBeVisible();
    await expect(footer.getByText('Company')).toBeVisible();
    await expect(footer.getByText('Legal')).toBeVisible();
    await expect(footer.getByText(/TribeMem. All rights reserved/)).toBeVisible();
  });
});
