import { test, expect } from '@playwright/test';
import { apiSignup, apiSeed, uniqueEmail } from '../helpers';

test.describe('professional journey', () => {
  test('signup through the UI as a professional lands in the worker workspace', async ({
    page,
    request,
  }) => {
    // Someone else's seeded job exists on the marketplace.
    const customer = await apiSignup(request, 'marketmaker', 0);
    await apiSeed(request, customer.token);

    await page.goto('/');
    await page.getByText('Sign in', { exact: true }).first().click();
    await page.getByText('Create account', { exact: true }).first().click();

    // Choose the professional account type.
    await page.getByText('Professional', { exact: true }).first().click();

    await page.getByLabel('First name', { exact: true }).fill('Petra');
    await page.getByLabel('Last name', { exact: true }).fill('Pro');
    await page.getByLabel('Email', { exact: true }).fill(uniqueEmail('uipro'));
    await page.getByLabel('Password', { exact: true }).fill('e2e-password-123');
    await page.getByText('Create account', { exact: true }).last().click();

    // Worker workspace pills.
    await expect(page.getByText('Available jobs', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('My bids', { exact: true }).first()).toBeVisible();

    // The seeded open job is browsable on the marketplace.
    await expect(page.getByText('[Sample] Leaky kitchen tap').first()).toBeVisible();
  });
});
