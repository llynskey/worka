import { test, expect } from '@playwright/test';

test.describe('landing page', () => {
  test('renders the Worku landing with waitlist and auth entry points', async ({ page }) => {
    await page.goto('/');

    // In dev the document title comes from react-navigation, so assert the
    // brand via the logo and eyebrow instead.
    await expect(page.getByRole('img', { name: 'Worku' }).first()).toBeVisible();
    await expect(page.getByText('Worku for expats').first()).toBeVisible();
    // Hero + waitlist panel
    await expect(page.getByText('Join the expat waitlist.')).toBeVisible();
    // Auth entry point
    await expect(page.getByText('Sign in', { exact: true }).first()).toBeVisible();
  });

  test('sign-in panel opens with login and create-account tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Sign in', { exact: true }).first().click();

    await expect(page.getByText('Welcome back.')).toBeVisible();
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByText('Create account', { exact: true }).first()).toBeVisible();
  });
});
