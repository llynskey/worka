import { APIRequestContext, Page, expect } from '@playwright/test';

export const API = 'http://localhost:8080';

let counter = 0;

/** Unique per-run email so journeys never collide with earlier data. */
export function uniqueEmail(tag: string): string {
  counter += 1;
  return `e2e-${tag}-${Date.now()}-${counter}@example.com`;
}

export interface TestUser {
  email: string;
  password: string;
  token: string;
  firstName: string;
}

/** Creates an account via the API (accountType 0 = customer, 1 = professional). */
export async function apiSignup(
  request: APIRequestContext,
  tag: string,
  accountType: 0 | 1,
): Promise<TestUser> {
  const email = uniqueEmail(tag);
  const password = 'e2e-password-123';
  const firstName = tag.charAt(0).toUpperCase() + tag.slice(1);
  const response = await request.post(`${API}/signup`, {
    data: { firstName, lastName: 'Tester', email, password, accountType },
  });
  expect(response.ok(), `signup failed: ${await response.text()}`).toBeTruthy();
  const body = await response.json();
  expect(body.token, 'signup returned no token').toBeTruthy();
  return { email, password, token: body.token, firstName };
}

/** Seeds sample jobs/bookings for the user (needs Dev__AllowSeed=true on the API). */
export async function apiSeed(request: APIRequestContext, token: string): Promise<void> {
  const response = await request.post(`${API}/api/dev/seed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `seed failed: ${await response.text()}`).toBeTruthy();
}

/** Professional sends a quote on a job via the API. */
export async function apiQuote(
  request: APIRequestContext,
  token: string,
  jobId: string,
  price: number,
): Promise<void> {
  const response = await request.post(`${API}/createQuote`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { jobId, price, description: 'E2E quote — fixed price, materials included.' },
  });
  expect(response.ok(), `createQuote failed: ${await response.text()}`).toBeTruthy();
}

/** Finds a marketplace job by name via the API (as the given user). */
export async function apiFindJob(
  request: APIRequestContext,
  token: string,
  nameContains: string,
): Promise<string> {
  const response = await request.get(`${API}/Jobs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const job = (body.data ?? []).find((j: any) => String(j.jobName).includes(nameContains));
  expect(job, `no marketplace job containing "${nameContains}"`).toBeTruthy();
  return job.jobId;
}

/**
 * The Expo dev server can accept its readiness probe and still reset the very
 * first page connection while it finishes booting — retry the initial goto.
 */
export async function gotoWithRetry(page: Page, path: string, attempts = 3): Promise<void> {
  for (let i = 1; ; i += 1) {
    try {
      await page.goto(path);
      return;
    } catch (error) {
      if (i >= attempts) throw error;
      await page.waitForTimeout(5_000);
    }
  }
}

/**
 * Signs the browser session in through the real login form.
 * Lands on the workspace once the token round-trips.
 */
export async function uiLogin(page: Page, user: TestUser): Promise<void> {
  await gotoWithRetry(page, '/');
  await page.getByText('Sign in', { exact: true }).first().click();
  await expect(page.getByText('Welcome back.')).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByText('Log in', { exact: true }).last().click();
}
