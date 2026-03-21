import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByText('Sign in to your TribeMem account')).toBeVisible();
  });

  test('displays TribeMem branding', async ({ page }) => {
    await expect(page.getByText('TribeMem')).toBeVisible();
  });

  test('email and password fields are present', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('sign in button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('OAuth buttons are displayed', async ({ page }) => {
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
  });

  test('forgot password link is visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('link to signup page is visible and works', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: 'Sign up' });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('form validation prevents empty submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    // HTML5 required validation should prevent form submission
    // The email input should show validation since it has required attribute
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('email field validates email format', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('password field is masked', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('signup page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
    await expect(page.getByText('Get started with TribeMem for free')).toBeVisible();
  });

  test('displays TribeMem branding', async ({ page }) => {
    await expect(page.getByText('TribeMem')).toBeVisible();
  });

  test('all form fields are present', async ({ page }) => {
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('create account button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('OAuth buttons are displayed', async ({ page }) => {
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
  });

  test('link to login page is visible and works', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: 'Sign in' });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('form validation prevents empty submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Create account' }).click();
    // HTML5 required validation should prevent form submission
    const nameInput = page.getByLabel('Full name');
    await expect(nameInput).toHaveAttribute('required', '');
  });

  test('email field validates email format', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('password field has minimum length requirement', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('minlength', '8');
  });

  test('terms of service and privacy policy links are visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });
});

test.describe('Auth Redirect', () => {
  test('accessing dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});
