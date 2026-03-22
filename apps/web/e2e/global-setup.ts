import { chromium, type FullConfig } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/user.json';

/**
 * Global setup for E2E tests.
 * Logs in with test credentials and saves the browser storage state so that
 * authenticated tests can reuse it without logging in again.
 *
 * Requires env vars:
 *   E2E_USER_EMAIL    — test user email
 *   E2E_USER_PASSWORD — test user password
 *
 * If these are not set, the setup is skipped and authenticated tests will
 * be skipped too (they check for PLAYWRIGHT_AUTH_FILE).
 */
async function globalSetup(_config: FullConfig) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    console.log('[E2E Setup] No E2E_USER_EMAIL/E2E_USER_PASSWORD set, skipping auth setup.');
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/(overview|onboarding)/, { timeout: 15000 });

    // Save the storage state
    await page.context().storageState({ path: AUTH_FILE });
    process.env.PLAYWRIGHT_AUTH_FILE = AUTH_FILE;

    console.log(`[E2E Setup] Auth state saved to ${AUTH_FILE}`);
  } catch (err) {
    console.error('[E2E Setup] Login failed:', err instanceof Error ? err.message : err);
    console.log('[E2E Setup] Authenticated tests will be skipped.');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
