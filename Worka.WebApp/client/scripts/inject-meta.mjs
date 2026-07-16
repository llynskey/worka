// Post-export step: the Expo web build produces a JS-only shell whose <body>
// is empty until the app hydrates. Search-engine, safe-browsing and web-filter
// crawlers often don't run JS, so they see a blank, "uncategorised" page — which
// is one reason strict ISP/mobile filters keep a new domain blocked. This script
// injects static Open Graph / Twitter tags, an Organization JSON-LD block, and a
// <noscript> description so those crawlers have real content to classify. It is
// idempotent and safe to run repeatedly.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../dist/index.html', import.meta.url);

const TITLE = 'Worka — get things done in your language';
const DESCRIPTION =
  'Worka connects expats and locals with trusted home-service professionals who speak your language — repairs, moving, cleaning, paperwork, installs and everyday jobs. Post a job, compare quotes, and pay securely.';
const URL_BASE = 'https://worka.site/';

const HEAD_EXTRA = `
    <link rel="canonical" href="${URL_BASE}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Worka" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta property="og:url" content="${URL_BASE}" />
    <meta property="og:locale" content="en_GB" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESCRIPTION}" />
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Worka',
      url: URL_BASE,
      description: DESCRIPTION,
      areaServed: 'GB',
    })}</script>
`;

const BODY_EXTRA = `
    <noscript>
      <div style="max-width:680px;margin:40px auto;padding:0 20px;font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6">
        <h1>Worka — get things done in your language</h1>
        <p>Worka is a home-services marketplace for expats and locals. Customers post everyday jobs — repairs, moving, cleaning, paperwork, installations — and compare quotes from trusted local professionals who speak their language. Professionals browse open jobs, send quotes, and get paid securely through Stripe.</p>
        <p>Available in English, Spanish, French, German, Italian, Portuguese, Dutch and Romanian. Please enable JavaScript to use the Worka app.</p>
        <p><a href="${URL_BASE}privacy.html">Privacy</a> &middot; <a href="${URL_BASE}terms.html">Terms</a></p>
      </div>
    </noscript>
`;

const MARKER = 'og:site_name';

const html = await readFile(FILE, 'utf8');

if (html.includes(MARKER)) {
  console.log('inject-meta: already injected, skipping.');
} else if (!html.includes('</head>') || !html.includes('</body>')) {
  console.error('inject-meta: could not find </head> or </body>; leaving index.html unchanged.');
  process.exit(0);
} else {
  const next = html
    .replace('</head>', `${HEAD_EXTRA}</head>`)
    .replace('</body>', `${BODY_EXTRA}</body>`);
  await writeFile(FILE, next, 'utf8');
  console.log('inject-meta: injected OG tags, JSON-LD and noscript content.');
}
