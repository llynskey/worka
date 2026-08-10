import { defineConfig } from '@playwright/test';

/**
 * Boots the whole stack for real-browser journeys:
 *  - Postgres: started separately via `npm run db:up` (docker, port 55432)
 *  - API:     `dotnet run` on :8080 against that Postgres, seed endpoint enabled
 *  - Web:     Expo web dev server on :8081 pointed at the API
 *
 * `webServer` reuses already-running servers, so you can keep the stack up
 * between runs for fast iteration (`reuseExistingServer`).
 */
export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  expect: { timeout: 20_000 },
  // Serial: the API rate-limits auth endpoints per-IP (10/min), and journeys
  // sign up fresh users; parallel workers would trip 429s.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8081',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    navigationTimeout: 180_000, // first load waits for the Expo bundle
  },
  webServer: [
    {
      command:
        'dotnet run --project ../Worka.WebApp --no-launch-profile',
      url: 'http://localhost:8080/health',
      timeout: 240_000,
      reuseExistingServer: true,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: 'http://localhost:8080',
        ConnectionStrings__Postgres:
          'Host=localhost;Port=55432;Database=worku_e2e;Username=worku;Password=worku_e2e_password',
        JwtSecret: 'e2e-only-secret-that-is-long-enough-for-hmac-sha256',
        Dev__AllowSeed: 'true',
      },
    },
    {
      command: 'npx expo start --web --port 8081',
      cwd: '../Worka.WebApp/client',
      url: 'http://localhost:8081',
      timeout: 300_000,
      reuseExistingServer: true,
      env: {
        CI: '1',
        BROWSER: 'none',
        // Trailing /api mirrors production (Caddy forwards /api/* unstripped),
        // so the client hits the same api/-prefixed routes it does live.
        EXPO_PUBLIC_API_URL: 'http://localhost:8080/api',
        EXPO_PUBLIC_ALLOW_SEED: 'true',
      },
    },
  ],
});
