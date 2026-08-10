import { test, expect } from '@playwright/test';
import { apiSignup, apiSeed, apiFindJob, apiQuote, uiLogin } from '../helpers';

test.describe('quote -> notification -> review quotes', () => {
  test('a pro quotes the customer job; the customer sees the bell badge and the quote', async ({
    page,
    request,
  }) => {
    // Customer with a seeded open job.
    const customer = await apiSignup(request, 'poster', 0);
    await apiSeed(request, customer.token);

    // A professional finds and quotes it via the API.
    const pro = await apiSignup(request, 'quoter', 1);
    const jobId = await apiFindJob(request, pro.token, '[Sample] Leaky kitchen tap');
    await apiQuote(request, pro.token, jobId, 95);

    // The customer sees it all in the UI.
    await uiLogin(page, customer);

    // Notification bell opens the panel and lists the event.
    await page.getByLabel('Notifications').first().click();
    await expect(page.getByText('New quote received').first()).toBeVisible();
    // Dismiss via the backdrop (panel is anchored top-right).
    await page.mouse.click(10, 500);
    await expect(page.getByText('New quote received')).toHaveCount(0);

    // The job card summarises the quotes instead of dumping them inline.
    await expect(page.getByText('Review 2 quotes')).toBeVisible();
  });
});
