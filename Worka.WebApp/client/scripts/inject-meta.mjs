// Post-export step: the Expo web build produces a JS-only shell whose <body>
// is empty until the app hydrates. Search-engine, safe-browsing and web-filter
// crawlers often don't run JS, so they see a blank, "uncategorised" page — which
// is one reason strict ISP/mobile filters keep a new domain blocked. This script
// injects a standard meta description, Open Graph / Twitter tags, Organization +
// WebSite JSON-LD, and a <noscript> description so those crawlers have real
// content to classify. It is idempotent and safe to run repeatedly.
//
// Social share image: if public/og-image.png (1200x630) exists it is wired up as
// og:image / twitter:image and the Twitter card upgrades to summary_large_image.
// Until then those tags are omitted so nothing points at a 404. Export one from
// assets/og-image.svg to enable link previews.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const FILE = new URL('../dist/index.html', import.meta.url);
const OG_IMAGE_FILE = new URL('../dist/og-image.png', import.meta.url);

const TITLE = 'Fixa — get things done in your language';
const DESCRIPTION =
  'Fixa connects expats and locals with trusted home-service professionals who speak your language — repairs, moving, cleaning, paperwork, installs and everyday jobs. Post a job, compare quotes, and pay securely.';
const URL_BASE = 'https://fixa.site/';

// The UI ships full packs for these; declared so crawlers know the site is
// multilingual even though every language shares the one URL (client-side i18n).
const LOCALES = ['en_GB', 'es_ES', 'fr_FR', 'de_DE', 'it_IT', 'pt_PT', 'nl_NL', 'ro_RO'];
const LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ro'];

const hasOgImage = existsSync(OG_IMAGE_FILE);
const OG_IMAGE_URL = `${URL_BASE}og-image.png`;

const imageTags = hasOgImage
  ? `
    <meta property="og:image" content="${OG_IMAGE_URL}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Fixa — get things done in your language" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${OG_IMAGE_URL}" />`
  : `
    <meta name="twitter:card" content="summary" />`;

const jsonLd = [
  {
    '@type': 'Organization',
    '@id': `${URL_BASE}#organization`,
    name: 'Fixa',
    url: URL_BASE,
    description: DESCRIPTION,
    areaServed: 'GB',
    ...(hasOgImage ? { logo: OG_IMAGE_URL } : {}),
  },
  {
    '@type': 'WebSite',
    '@id': `${URL_BASE}#website`,
    name: 'Fixa',
    url: URL_BASE,
    description: DESCRIPTION,
    inLanguage: LANGS,
    publisher: { '@id': `${URL_BASE}#organization` },
  },
];

const HEAD_EXTRA = `
    <meta name="description" content="${DESCRIPTION}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${URL_BASE}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Fixa" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta property="og:url" content="${URL_BASE}" />
    <meta property="og:locale" content="${LOCALES[0]}" />
${LOCALES.slice(1)
  .map((l) => `    <meta property="og:locale:alternate" content="${l}" />`)
  .join('\n')}
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESCRIPTION}" />${imageTags}
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': jsonLd,
    })}</script>
`;

const BODY_EXTRA = `
    <noscript>
      <div style="max-width:680px;margin:40px auto;padding:0 20px;font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6">
        <h1>Fixa — get things done in your language</h1>
        <p>Fixa is a home-services marketplace for expats and locals. Customers post everyday jobs — repairs, moving, cleaning, paperwork, installations — and compare quotes from trusted local professionals who speak their language. Professionals browse open jobs, send quotes, and get paid securely through Stripe.</p>
        <p>Available in English, Spanish, French, German, Italian, Portuguese, Dutch and Romanian. Please enable JavaScript to use the Fixa app.</p>
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
  console.log(
    `inject-meta: injected meta description, OG/Twitter tags, JSON-LD and noscript content` +
      `${hasOgImage ? ' (with og:image)' : ' (no og-image.png found — link previews disabled)'}.`,
  );
}
