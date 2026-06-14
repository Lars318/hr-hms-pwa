// @ts-check
import nextPwa from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev,
  // Custom service worker additions (push event handler, notificationclick)
  customWorkerDir: "worker",
  // fallbacks disabled: next-pwa@5.6.0 has a build bug with fallbacks + Next.js 14
  // The /offline page still exists and can be linked manually.
  publicExcludes: [
    "!robots.txt",
    "!sitemap.xml",
  ],
  buildExcludes: [
    /middleware-manifest\.json$/,
    /app-build-manifest\.json$/,
  ],
  runtimeCaching: [
    // CSV report export – NEVER cache (RBAC-filtered sensitive data)
    {
      urlPattern: /\/api\/reports\/csv/,
      handler: "NetworkOnly",
    },
    // tRPC API – Network First, short cache
    {
      urlPattern: /^https?:\/\/.*\/api\/trpc\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "trpc-cache",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Supabase signed URLs – NEVER cache (contain secrets, expire quickly)
    {
      urlPattern: /supabase\.co\/storage\/v1\/object\/sign\//,
      handler: "NetworkOnly",
    },
    // Supabase auth endpoints – NEVER cache
    {
      urlPattern: /supabase\.co\/auth\//,
      handler: "NetworkOnly",
    },
    // Next.js static assets – Cache First
    {
      urlPattern: /^\/_next\/static\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // Images/icons – Cache First
    {
      urlPattern: /\.(png|jpg|jpeg|svg|ico|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // App navigation pages – Network First with offline fallback
    {
      urlPattern: /^https?:\/\/.*\/(?!api\/).*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

// ── Content Security Policy ───────────────────────────────────────────────────
// Next.js 14 App Router requires 'unsafe-inline' for scripts (bootstrap chunks).
// For a stricter policy, implement nonce-based CSP via middleware — see README.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const cspDirectives = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for hydration scripts in App Router
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Supabase (REST, realtime, auth, storage)
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  // No iframes
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Prevent this page from being framed (clickjacking)
  "frame-ancestors 'none'",
];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // HSTS: production only – tell browsers to always use HTTPS (1 year)
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Sentry server-side initialization via instrumentation.ts
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const config = withPWA(nextConfig);

export default withSentryConfig(config, {
  // Sentry organization and project (used for source map upload at build time)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress noisy output during build
  silent: !process.env.CI,

  // Upload wider set of source maps for better stack traces
  widenClientFileUpload: true,

  // Route Sentry requests through app to avoid ad-blockers
  tunnelRoute: "/monitoring-tunnel",

  // Hide source maps from browser devtools in production
  hideSourceMaps: true,

  // Remove Sentry logger from client bundle
  disableLogger: true,

  // Skip source map upload if no auth token (local dev)
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
