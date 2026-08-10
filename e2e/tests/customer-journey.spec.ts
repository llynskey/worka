import { test, expect } from '@playwright/test';
import { apiSignup, apiSeed, uiLogin } from '../helpers';

test.describe('customer journey', () => {
  test('login -> dashboard shows seeded jobs -> cancel a booking with refund', async ({ page, request }) => {
    const customer = await apiSignup(request, 'customer', 0);
    await apiSeed(request, customer.token);

    await uiLogin(page, customer);

    // Workspace pills are up.
    await expect(page.getByText('Post a job', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Find professionals', { exact: true }).first()).toBeVisible();

    // Seeded jobs render on the dashboard (names also appear in the activity
    // rail, so match loosely and take the first).
    await expect(page.getByText('Your jobs')).toBeVisible();
    await expect(page.getByText('[Sample] Leaky kitchen tap').first()).toBeVisible();
    await expect(page.getByText('[Sample] Repaint bathroom').first()).toBeVisible();

    // The booked job carries the scheduling handshake from its quote.
    await expect(page.getByText('Proposed time — please confirm')).toBeVisible();

    // Cancel the booked job: in-app confirm dialog, then success toast, and the
    // card leaves the active list (status -> Cancelled).
    await page.getByText('Cancel booking', { exact: true }).first().click();
    await expect(page.getByText('Cancel this booking?')).toBeVisible();
    await page.getByText('Cancel booking', { exact: true }).last().click();

    await expect(page.getByText('Booking cancelled').first()).toBeVisible();
    // The card leaves the Active list once cancelled.
    await expect(page.getByText('Cancel booking', { exact: true })).toHaveCount(0);
  });

  test('confirming a proposed appointment time', async ({ page, request }) => {
    const customer = await apiSignup(request, 'scheduler', 0);
    await apiSeed(request, customer.token);

    await uiLogin(page, customer);
    await expect(page.getByText('Proposed time — please confirm')).toBeVisible();

    await page.getByText('Confirm', { exact: true }).first().click();

    await expect(page.getByText('Appointment confirmed').first()).toBeVisible();
  });
});
