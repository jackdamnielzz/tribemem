import { test, expect } from '@playwright/test';

/**
 * Dashboard tests.
 *
 * The dashboard layout requires Supabase authentication. In a real CI setup
 * these tests would use a seeded test user or mock the auth layer. The tests
 * below are structured so they:
 *   1. Verify the redirect-to-login guard works for unauthenticated users.
 *   2. When a storage-state / mock auth is provided, verify the dashboard UI.
 *
 * To run the authenticated tests locally, create an `e2e/.auth/user.json`
 * storage state file by running the login flow once with:
 *   npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000
 */

test.describe('Dashboard - Unauthenticated', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test('accessing knowledge page redirects to login', async ({ page }) => {
    await page.goto('/knowledge/facts');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test('accessing settings page redirects to login', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test('accessing connectors page redirects to login', async ({ page }) => {
    await page.goto('/connectors');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Dashboard - Authenticated', () => {
  // Skip these tests if no auth storage state is available.
  // To enable, set PLAYWRIGHT_AUTH_FILE env var to the storage state path,
  // or place the file at e2e/.auth/user.json.
  test.skip(
    () => !process.env.PLAYWRIGHT_AUTH_FILE,
    'Skipped: no auth storage state provided. Set PLAYWRIGHT_AUTH_FILE to enable.'
  );

  test.use({
    storageState: process.env.PLAYWRIGHT_AUTH_FILE || 'e2e/.auth/user.json',
  });

  test('overview page displays stats', async ({ page }) => {
    await page.goto('/overview');
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.getByText("Your organization's knowledge at a glance")).toBeVisible();

    // Stat cards
    await expect(page.getByText('Total Knowledge')).toBeVisible();
    await expect(page.getByText('Active Connectors')).toBeVisible();
    await expect(page.getByText('Queries This Week')).toBeVisible();
    await expect(page.getByText('Pending Alerts')).toBeVisible();
  });

  test('overview page displays knowledge growth and recent queries', async ({ page }) => {
    await page.goto('/overview');
    await expect(page.getByText('Knowledge Growth')).toBeVisible();
    await expect(page.getByText('Recent Queries')).toBeVisible();
  });

  test('overview page displays active alerts', async ({ page }) => {
    await page.goto('/overview');
    await expect(page.getByText('Active Alerts')).toBeVisible();
    await expect(page.getByText('Conflicting refund policies detected')).toBeVisible();
    await expect(page.getByText('Deployment process may be outdated')).toBeVisible();
  });

  test('sidebar navigation items are visible', async ({ page }) => {
    await page.goto('/overview');

    const sidebar = page.locator('aside, nav').first();
    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByText('Ask')).toBeVisible();
    await expect(page.getByText('Knowledge')).toBeVisible();
    await expect(page.getByText('Connectors')).toBeVisible();
    await expect(page.getByText('Crawler')).toBeVisible();
    await expect(page.getByText('Team')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('sidebar navigation to Ask page works', async ({ page }) => {
    await page.goto('/overview');
    await page.getByRole('link', { name: 'Ask' }).click();
    await expect(page).toHaveURL(/\/ask/);
  });

  test('sidebar navigation to Connectors page works', async ({ page }) => {
    await page.goto('/overview');
    await page.getByRole('link', { name: 'Connectors' }).click();
    await expect(page).toHaveURL(/\/connectors/);
  });

  test('sidebar navigation to Team page works', async ({ page }) => {
    await page.goto('/overview');
    await page.getByRole('link', { name: 'Team' }).click();
    await expect(page).toHaveURL(/\/team/);
  });
});
